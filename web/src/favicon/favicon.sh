# It's possible to export all sizes directly from inkscape.
# That would keep things sharp, but steps would be not equidistant.
# Having them blurry at 16px seems preferable.
# Also, that's one script to run, instead of lot of clicking.

for x in 16 32 64 128; do
    convert favicon256.png -resize ${x}x${x} favicon${x}.png
done

convert favicon*.png favicon.ico
