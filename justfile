# itch.io project, as <user>/<game>; the only place the release target appears.
itch_target := "kajyr/glow-below"

# List the recipes.
default:
    @just --list

# Test, bump the version, build the itch.io zip and push it to the html5 channel.
# Every feature release bumps a minor; pass `patch` for a fix-only release.
release bump="minor":
    npm test
    npm version {{bump}} --no-git-tag-version
    npm run build:itch
    butler push release/glowbelow-itch.zip {{itch_target}}:html5 --userversion "$(node -p "require('./package.json').version")"

# Android toolchain (see AGENTS.md); a value already set in the shell wins.
export JAVA_HOME := env_var_or_default("JAVA_HOME", "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home")
export ANDROID_HOME := env_var_or_default("ANDROID_HOME", home_directory() / "Library/Android/sdk")
export NDK_HOME := env_var_or_default("NDK_HOME", home_directory() / "Library/Android/sdk/ndk/29.0.14206865")
keystore := env_var_or_default("GLOWBELOW_KEYSTORE", home_directory() / ".config/glowbelow/keystore.properties")

# `just release` bumps the version first; this only builds from the current one.
# Test, then build the signed Android App Bundle for Google Play.
release-android:
    @test -f "{{keystore}}" || { echo "Missing the upload key: {{keystore}} (see AGENTS.md, Android release)"; exit 1; }
    npm test
    npx tauri android build --aab
    @ls -1 src-tauri/gen/android/app/build/outputs/bundle/universalRelease/*.aab
