# itch.io project, as <user>/<game>; the only place the release target appears.
itch_target := "kajyr/glow-below"

# List the recipes.
default:
    @just --list

# Test, build the itch.io zip and push it to the html5 channel.
release:
    npm test
    npm run build:itch
    butler push release/glowbelow-itch.zip {{itch_target}}:html5 --userversion "$(node -p "require('./package.json').version")"
