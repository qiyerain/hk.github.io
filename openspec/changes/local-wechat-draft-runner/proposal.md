## Why

The weekly WeChat workflow currently assembles ad hoc commands and uses two credential variable conventions. The proven local path loads `.env.local`, maps `WECHAT_APPID` and `WECHAT_SECRET` to the names expected by `baoyu-post-to-wechat`, and submits the already-rendered HTML directly.

## What Changes

- Add one repository-owned command for creating a WeChat draft from an existing run state.
- Reuse `wechat.html`, metadata, cover, and source URL recorded for that run.
- Refuse duplicate `draft/add` calls when state already contains a `media_id`.
- Persist the returned `media_id` immediately and verify the remote draft with `draft/get`.
- Make this command the preferred draft path in the article orchestrator.

## Impact

The change affects only the local WeChat draft workflow. It does not publish, mass-send, preview, or alter blog content.
