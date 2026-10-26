#!/usr/bin/env bash

set -u

DAEMON_PATTERN='/agent-browser/bin/agent-browser-darwin-(arm64|x64)( |$)'
BROWSER_PATTERN='[G]oogle Chrome.*--user-data-dir=[^ ]*/agent-browser-chrome-'

show_status() {
  echo '== agent-browser sessions =='
  agent-browser session list 2>/dev/null || true

  echo
  echo '== agent-browser daemons =='
  pgrep -fl "$DAEMON_PATTERN" 2>/dev/null || true

  echo
  echo '== automation Chrome parents =='
  pgrep -fl "$BROWSER_PATTERN" 2>/dev/null || true
}

graceful_close() {
  agent-browser close --all 2>/dev/null || true
  agent-browser doctor --offline --quick 2>/dev/null || true
}

signal_matches() {
  local signal="$1"
  local pattern="$2"
  local pids

  pids="$(pgrep -f "$pattern" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill "-$signal" $pids 2>/dev/null || true
  fi
}

force_close() {
  graceful_close
  signal_matches TERM "$DAEMON_PATTERN"
  signal_matches TERM "$BROWSER_PATTERN"
  sleep 3
  signal_matches KILL "$DAEMON_PATTERN"
  signal_matches KILL "$BROWSER_PATTERN"
}

case "${1:-status}" in
  status)
    show_status
    ;;
  close)
    graceful_close
    show_status
    ;;
  force)
    force_close
    show_status
    ;;
  *)
    echo "Usage: $0 [status|close|force]" >&2
    exit 2
    ;;
esac
