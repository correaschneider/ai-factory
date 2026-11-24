#!/usr/bin/env bash
# Factory greeting — SessionStart (startup) hook.
# Shows one line after the first install and after each minor/major update; silent on every other session.
# State: a single marker file in $CLAUDE_PLUGIN_DATA holding the last greeted version. No network, no telemetry.
# Any failure → exit 0 without output: a greeting must never get in the way of a session.

set -u
trap 'exit 0' ERR

data_dir="${CLAUDE_PLUGIN_DATA:-}"
root="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
[ -n "$data_dir" ] || exit 0                       # nowhere to remember it → stay quiet, never nag

version="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$root/.claude-plugin/plugin.json" | head -n1)"
[ -n "$version" ] || exit 0

marker="$data_dir/greeted-version"
last=""
[ -f "$marker" ] && last="$(head -n1 "$marker" 2>/dev/null || true)"

minor() { printf '%s' "$1" | cut -d. -f1-2; }
if [ -n "$last" ] && [ "$(minor "$last")" = "$(minor "$version")" ]; then
  exit 0                                           # same major.minor (patch updates included) → silent
fi

# Language: the project's factory config first, then the system locale.
lang=""
cfg="${CLAUDE_PROJECT_DIR:-$PWD}/docs/factory.config.md"
[ -f "$cfg" ] && lang="$(sed -n 's/^language:[[:space:]]*\([A-Za-z-]*\).*/\1/p' "$cfg" | head -n1)"
[ -n "$lang" ] || lang="${LC_ALL:-${LC_MESSAGES:-${LANG:-en}}}"
case "$lang" in pt*|PT*) lang=pt ;; *) lang=en ;; esac

# What's new per minor version (one line each). Add a line on every minor release.
whats_new() {
  case "$lang:$(minor "$version")" in
    pt:1.6) echo "novo /factory:start mostra o que a fábrica faz neste projeto e o próximo comando" ;;
    en:1.6) echo "new /factory:start shows what the factory can do in this project and the next command" ;;
    pt:1.5) echo "o PO faz triagem e sugere a profundidade (lean, standard, deep)" ;;
    en:1.5) echo "the PO triages and suggests a depth (lean, standard, deep)" ;;
    *) echo "" ;;
  esac
}

if [ -z "$last" ]; then
  if [ "$lang" = pt ]; then
    msg="Factory v$version instalada. Digite /factory:start para ver o que ela faz neste projeto."
  else
    msg="Factory v$version installed. Type /factory:start to see what it can do in this project."
  fi
  ctx="The factory plugin (v$version) was just installed. Some clients do not show hook messages, so in your FIRST reply of this session add one short final line, in the user's language, saying the Factory v$version is installed and that /factory:start shows what it can do in this project. Only once; never repeat it later in the session."
else
  news="$(whats_new)"
  tail_pt=" /factory:start para ver."; tail_en=" /factory:start to see."
  case "$news" in *"/factory:start"*) tail_pt=""; tail_en="" ;; esac
  if [ "$lang" = pt ]; then
    msg="Factory atualizada para v$version${news:+: $news}.$tail_pt"
  else
    msg="Factory updated to v$version${news:+: $news}.$tail_en"
  fi
  ctx="The factory plugin was updated from v$last to v$version${news:+ ($news)}. Some clients do not show hook messages, so in your FIRST reply of this session add one short final line, in the user's language, saying the Factory was updated to v$version${news:+ and what is new}, and that /factory:start shows it. Only once; never repeat it later in the session."
fi

json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

{ mkdir -p "$data_dir" && printf '%s\n' "$version" > "$marker"; } 2>/dev/null || exit 0

printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' \
  "$(json_escape "$msg")" "$(json_escape "$ctx")"
