#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  claude-swarm.sh start <count> [session_name] [workspace] [claude_cmd]
  claude-swarm.sh status [session_name]
  claude-swarm.sh attach [session_name]
  claude-swarm.sh stop [session_name]

Examples:
  ./scripts/supervisor/claude-swarm.sh start 3 claude-swarm "$(pwd)" claude
  ./scripts/supervisor/claude-swarm.sh status claude-swarm
  ./scripts/supervisor/claude-swarm.sh attach claude-swarm
  ./scripts/supervisor/claude-swarm.sh stop claude-swarm
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

session_exists() {
  local session="$1"
  tmux has-session -t "$session" 2>/dev/null
}

start_swarm_macos_terminal() {
  local count="$1"
  local workspace="$2"
  local claude_cmd="$3"

  require_cmd osascript
  require_cmd "$claude_cmd"

  local i
  for (( i = 1; i <= count; i++ )); do
    osascript \
      -e 'tell application "Terminal" to activate' \
      -e "tell application \"Terminal\" to do script \"cd '$workspace'; CLAUDE_INSTANCE=$i $claude_cmd\""
  done

  echo "Opened $count Terminal tabs/windows with Claude instances."
  echo "tmux is not installed, so status/attach/stop management is manual in Terminal."
}

start_swarm() {
  local count="${1:-}"
  local session="${2:-claude-swarm}"
  local workspace="${3:-$(pwd)}"
  local claude_cmd="${4:-claude}"

  if [[ -z "$count" ]] || ! [[ "$count" =~ ^[0-9]+$ ]] || [[ "$count" -lt 1 ]]; then
    echo "count must be an integer >= 1" >&2
    exit 1
  fi

  require_cmd "$claude_cmd"

  if command -v tmux >/dev/null 2>&1; then
    if session_exists "$session"; then
      echo "Session '$session' already exists. Use attach/status/stop." >&2
      exit 1
    fi
  else
    if [[ "$(uname -s)" == "Darwin" ]]; then
      start_swarm_macos_terminal "$count" "$workspace" "$claude_cmd"
      return 0
    fi

    echo "tmux is required on non-macOS environments." >&2
    exit 1
  fi

  local i
  local window_name

  window_name="claude-1"
  tmux new-session -d -s "$session" -n "$window_name" \
    "cd '$workspace' && CLAUDE_INSTANCE=1 $claude_cmd"

  for (( i = 2; i <= count; i++ )); do
    window_name="claude-$i"
    tmux new-window -t "$session:" -n "$window_name" \
      "cd '$workspace' && CLAUDE_INSTANCE=$i $claude_cmd"
  done

  tmux set-option -t "$session" remain-on-exit on >/dev/null

  echo "Started '$session' with $count Claude instances."
  echo "Attach with: tmux attach -t $session"
}

status_swarm() {
  local session="${1:-claude-swarm}"
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux is not installed. Status is only available for tmux-managed sessions."
    exit 1
  fi

  if ! session_exists "$session"; then
    echo "Session '$session' not found."
    exit 1
  fi

  echo "Session: $session"
  tmux list-windows -t "$session" -F '#{window_index}:#{window_name} active=#{window_active} panes=#{window_panes}'
  echo
  tmux list-panes -a -t "$session" \
    -F 'window=#{window_name} pane=#{pane_index} pid=#{pane_pid} cmd=#{pane_current_command} dead=#{pane_dead}'
}

attach_swarm() {
  local session="${1:-claude-swarm}"
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux is not installed. Attach is only available for tmux-managed sessions."
    exit 1
  fi

  if ! session_exists "$session"; then
    echo "Session '$session' not found."
    exit 1
  fi

  tmux attach -t "$session"
}

stop_swarm() {
  local session="${1:-claude-swarm}"
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux is not installed. Stop is only available for tmux-managed sessions."
    exit 1
  fi

  if ! session_exists "$session"; then
    echo "Session '$session' not found."
    exit 1
  fi

  tmux kill-session -t "$session"
  echo "Stopped session '$session'."
}

main() {
  local action="${1:-}"
  shift || true

  case "$action" in
    start) start_swarm "$@" ;;
    status) status_swarm "$@" ;;
    attach) attach_swarm "$@" ;;
    stop) stop_swarm "$@" ;;
    -h|--help|help|"") usage ;;
    *)
      echo "Unknown action: $action" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
