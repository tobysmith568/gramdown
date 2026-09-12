#!/bin/sh
set -eu

# Wrapping everything in one function called on the last line means a
# connection that drops mid-download hands `sh` an incomplete function body
# (a syntax error) instead of a truncated, partially-executed script.
install_gramdown() {
  repo_url="https://github.com/tobysmith568/gramdown"

  os_name=$(uname -s)
  case "$os_name" in
    Linux) os=linux ;;
    Darwin) os=darwin ;;
    *)
      echo "error: unsupported OS '$os_name'" >&2
      echo "See https://gramdown.tobythe.dev/docs/downloads for other install options." >&2
      exit 1
      ;;
  esac

  arch_name=$(uname -m)
  case "$arch_name" in
    x86_64 | amd64) arch=x64 ;;
    arm64 | aarch64) arch=arm64 ;;
    *)
      echo "error: unsupported architecture '$arch_name'" >&2
      echo "See https://gramdown.tobythe.dev/docs/downloads for other install options." >&2
      exit 1
      ;;
  esac

  asset="gramdown-$os-$arch"

  if [ -n "${GRAMDOWN_VERSION:-}" ]; then
    base_url="$repo_url/releases/download/v$GRAMDOWN_VERSION"
  else
    base_url="$repo_url/releases/latest/download"
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "error: curl is required to run this installer" >&2
    echo "Install curl, or download gramdown manually from https://gramdown.tobythe.dev/docs/downloads" >&2
    exit 1
  fi

  tmp_dir=$(mktemp -d)
  trap 'rm -rf "$tmp_dir"' EXIT

  echo "Downloading $asset..."
  curl -fsSL -o "$tmp_dir/$asset" "$base_url/$asset"
  curl -fsSL -o "$tmp_dir/SHA256SUMS.txt" "$base_url/SHA256SUMS.txt"

  checksum_line=$(grep " $asset\$" "$tmp_dir/SHA256SUMS.txt" || true)
  if [ -z "$checksum_line" ]; then
    echo "error: no checksum entry found for $asset in SHA256SUMS.txt" >&2
    exit 1
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    if ! (cd "$tmp_dir" && printf '%s\n' "$checksum_line" | sha256sum -c - >/dev/null 2>&1); then
      echo "error: checksum verification failed for $asset" >&2
      exit 1
    fi
  elif command -v shasum >/dev/null 2>&1; then
    if ! (cd "$tmp_dir" && printf '%s\n' "$checksum_line" | shasum -a 256 -c - >/dev/null 2>&1); then
      echo "error: checksum verification failed for $asset" >&2
      exit 1
    fi
  else
    echo "error: neither sha256sum nor shasum is available; cannot verify the download" >&2
    exit 1
  fi

  install_dir="${GRAMDOWN_INSTALL_DIR:-$HOME/.local/bin}"
  mkdir -p "$install_dir"

  previous_version=""
  if [ -x "$install_dir/gramdown" ]; then
    previous_version=$("$install_dir/gramdown" --version 2>/dev/null || true)
  fi

  chmod +x "$tmp_dir/$asset"
  mv "$tmp_dir/$asset" "$install_dir/gramdown"

  new_version=$("$install_dir/gramdown" --version)

  if [ -n "$previous_version" ] && [ "$previous_version" != "$new_version" ]; then
    echo "Upgraded gramdown $previous_version -> $new_version"
  elif [ -n "$previous_version" ]; then
    echo "Reinstalled gramdown $new_version"
  else
    echo "Installed gramdown $new_version"
  fi
  echo "Location: $install_dir/gramdown"

  case ":$PATH:" in
    *":$install_dir:"*) ;;
    *)
      echo ""
      echo "$install_dir is not on your PATH. Add this to your shell profile:"
      echo "  export PATH=\"$install_dir:\$PATH\""
      ;;
  esac
}

install_gramdown "$@"
