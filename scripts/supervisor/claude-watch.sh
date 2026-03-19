#!/usr/bin/env bash
set -euo pipefail

interval="${1:-3}"
pattern="${2:-claude|claude-code|claude_desktop}"

if ! [[ "$interval" =~ ^[0-9]+$ ]] || [[ "$interval" -lt 1 ]]; then
  echo "Interval must be an integer >= 1" >&2
  exit 1
fi

tmp_file="/tmp/claude_watch_$$.txt"
trap 'rm -f "$tmp_file"' EXIT

echo "Watching processes matching regex: $pattern"
echo "Interval: ${interval}s"
echo "Press Ctrl+C to stop."
echo

while true; do
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  pgrep -ifl "$pattern" >"$tmp_file" 2>/dev/null || true

  if [[ -s "$tmp_file" ]]; then
    echo "[$ts] claude process detected"
    while read -r line; do
      pid="$(awk '{print $1}' <<<"$line")"
      cmd="$(cut -d' ' -f2- <<<"$line")"
      stats="$(ps -p "$pid" -o %cpu=,%mem=,rss=,etime= | awk '{$1=$1; print}')"
      echo "  pid=$pid cpu_mem_rss_elapsed=[$stats] cmd=$cmd"
    done <"$tmp_file"
  else
    echo "[$ts] claude process not found"
  fi

  echo "---"
  sleep "$interval"
done
