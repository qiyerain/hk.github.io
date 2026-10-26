#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: scripts/wechat_draft_local.sh <run-id> [--dry-run]" >&2
  exit 2
}

timestamp() {
  date '+%Y-%m-%dT%H:%M:%S%z' | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/'
}

[[ $# -ge 1 && $# -le 2 ]] || usage

run_id="$1"
dry_run="false"
if [[ ${2:-} == "--dry-run" ]]; then
  dry_run="true"
elif [[ $# -eq 2 ]]; then
  usage
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

state="drafts/wechat/${run_id}/state.json"
inspect="drafts/wechat/${run_id}/inspect.json"
env_file=".env.local"
publisher=".codex/skills/baoyu-post-to-wechat/scripts/wechat-api.ts"

for required in "$state" "$inspect" "$env_file" "$publisher"; do
  [[ -f "$required" ]] || { echo "Missing required file: $required" >&2; exit 1; }
done
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
command -v bun >/dev/null || { echo "bun is required" >&2; exit 1; }

existing_media_id="$(jq -r '.stages.draft.media_id // .draft_media_id // empty' "$state")"
operation="draft/add"
update_args=()
if [[ -n "$existing_media_id" ]]; then
  operation="draft/update"
  update_args=(--update-media-id "$existing_media_id")
fi

html="$(jq -r '.wechat_html_path // empty' "$state")"
title="$(jq -r '.data.metadata.title.value // empty' "$inspect")"
summary="$(jq -r '.data.metadata.digest.value // empty' "$inspect")"
cover="$(jq -r '[.assets[]?.path | select(test("wechat-cover"))][0] // empty' "$state")"
source_url="$(jq -r '.stages.blog.live_url // empty' "$state")"

[[ -n "$html" && -f "$html" ]] || { echo "Missing rendered HTML: $html" >&2; exit 1; }
[[ -n "$title" ]] || { echo "Missing title in $inspect" >&2; exit 1; }
[[ -n "$summary" ]] || { echo "Missing digest in $inspect" >&2; exit 1; }
[[ -n "$cover" && -f "$cover" ]] || { echo "Missing local WeChat cover: $cover" >&2; exit 1; }
[[ -n "$source_url" ]] || { echo "Missing blog live_url in $state" >&2; exit 1; }

read -r ul_count li_count local_img_count < <(node - "$html" <<'NODE'
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const doc = new JSDOM(fs.readFileSync(process.argv[2], 'utf8')).window.document;
process.stdout.write(`${doc.querySelectorAll('ul').length} ${doc.querySelectorAll('li').length} ${doc.querySelectorAll('img').length}\n`);
NODE
)
if [[ "$ul_count" -ne 0 || "$li_count" -ne 0 ]]; then
  echo "Weekly WeChat HTML rejected: ul_count=$ul_count li_count=$li_count" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$env_file"
set +a
: "${WECHAT_APPID:?WECHAT_APPID is missing from .env.local}"
: "${WECHAT_SECRET:?WECHAT_SECRET is missing from .env.local}"
export WECHAT_APP_ID="$WECHAT_APPID"
export WECHAT_APP_SECRET="$WECHAT_SECRET"

args=(
  "$publisher" "$html"
  --title "$title"
  --summary "$summary"
  --cover "$cover"
  --source-url "$source_url"
)
if [[ ${#update_args[@]} -gt 0 ]]; then
  args+=("${update_args[@]}")
fi

if [[ "$dry_run" == "true" ]]; then
  bun "${args[@]}" --dry-run
  exit 0
fi

result="$(bun "${args[@]}")"
media_id="$(jq -er 'select(.success == true) | .media_id' <<<"$result")"
now="$(timestamp)"
html_sha256="$(shasum -a 256 "$html" | awk '{print $1}')"

state_tmp="$(mktemp "${state}.tmp.XXXXXX")"
jq \
  --arg media_id "$media_id" \
  --arg now "$now" \
  --arg operation "$operation" \
  --arg html_sha256 "$html_sha256" \
  '.updated_at = $now
   | .wechat_html_sha256 = $html_sha256
   | .stages.draft = {
       ok: false,
       status: "created_pending_verification",
       operation: $operation,
       media_id: $media_id,
       updated_at: $now
     }' "$state" > "$state_tmp"
mv "$state_tmp" "$state"

token_json="$(curl -sS --max-time 20 -G 'https://api.weixin.qq.com/cgi-bin/token' \
  --data-urlencode 'grant_type=client_credential' \
  --data-urlencode "appid=$WECHAT_APP_ID" \
  --data-urlencode "secret=$WECHAT_APP_SECRET")"
access_token="$(jq -er '.access_token' <<<"$token_json")"
draft_json="$(curl -sS --max-time 30 -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg media_id "$media_id" '{media_id:$media_id}')" \
  "https://api.weixin.qq.com/cgi-bin/draft/get?access_token=${access_token}")"

if jq -e '.errcode and .errcode != 0' >/dev/null <<<"$draft_json"; then
  echo "$draft_json" | jq . >&2
  echo "Draft was created and recorded, but draft/get verification failed. Do not rerun draft/add." >&2
  exit 4
fi

verification="$(node - "$draft_json" <<'NODE'
const { JSDOM } = require('jsdom');
const payload = JSON.parse(process.argv[2]);
const article = payload.news_item?.[0] || {};
const doc = new JSDOM(article.content || '').window.document;
process.stdout.write(JSON.stringify({
  title: article.title || '',
  digest: article.digest || '',
  thumb_media_id: article.thumb_media_id || '',
  content_source_url: article.content_source_url || '',
  img_count: doc.querySelectorAll('img').length,
  ul_count: doc.querySelectorAll('ul').length,
  li_count: doc.querySelectorAll('li').length,
  anchor_count: doc.querySelectorAll('a[href]').length,
}));
NODE
)"

verified_title="$(jq -r '.title' <<<"$verification")"
verified_digest="$(jq -r '.digest' <<<"$verification")"
verified_thumb="$(jq -r '.thumb_media_id' <<<"$verification")"
verified_source_url="$(jq -r '.content_source_url' <<<"$verification")"
verified_img_count="$(jq -r '.img_count' <<<"$verification")"
verified_ul="$(jq -r '.ul_count' <<<"$verification")"
verified_li="$(jq -r '.li_count' <<<"$verification")"
[[ "$verified_title" == "$title" ]] || { echo "draft/get title mismatch" >&2; exit 4; }
[[ "$verified_digest" == "$summary" ]] || { echo "draft/get digest mismatch" >&2; exit 4; }
[[ -n "$verified_thumb" ]] || { echo "draft/get thumb_media_id is empty" >&2; exit 4; }
[[ "$verified_source_url" == "$source_url" ]] || { echo "draft/get content_source_url mismatch" >&2; exit 4; }
[[ "$verified_img_count" -eq "$local_img_count" ]] || { echo "draft/get image count mismatch: local=$local_img_count remote=$verified_img_count" >&2; exit 4; }
[[ "$verified_ul" -eq 0 && "$verified_li" -eq 0 ]] || { echo "draft/get list-tag verification failed" >&2; exit 4; }

verified_at="$(timestamp)"
state_tmp="$(mktemp "${state}.tmp.XXXXXX")"
jq \
  --arg verified_at "$verified_at" \
  --argjson verification "$verification" \
  '.updated_at = $verified_at
   | .stages.draft.ok = true
   | .stages.draft.status = "completed"
   | .stages.draft.verification = ($verification + {verified_at: $verified_at})' \
  "$state" > "$state_tmp"
mv "$state_tmp" "$state"

jq -n --arg media_id "$media_id" --arg state "$state" --argjson verification "$verification" \
  '{success:true, media_id:$media_id, state:$state, verification:$verification}'
