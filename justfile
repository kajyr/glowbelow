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
