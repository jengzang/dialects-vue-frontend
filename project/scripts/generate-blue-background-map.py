"""Bake existing GIS into a background WebP. Offline only; requires Python/Pillow.

Run: python3 scripts/generate-blue-background-map.py
Survey dots remain live and are deliberately excluded from this image.
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GIS = ROOT / 'public/data/gis'
WIDTH, PADDING, AA = 1000, 4, 3


def project(lon, lat):
    rad = math.pi / 180
    n = (math.sin(25 * rad) + math.sin(47 * rad)) / 2
    c = math.cos(25 * rad) ** 2 + 2 * n * math.sin(25 * rad)
    rho = math.sqrt(c - 2 * n * math.sin(lat * rad)) / n
    theta = n * (lon - 105) * rad
    return rho * math.sin(theta), rho * math.cos(theta)


def load(name):
    return json.loads((GIS / (name + '.geojson')).read_text())['features']


def polygons(features):
    for feature in features:
        geometry = feature['geometry']
        if geometry['type'] == 'MultiPolygon':
            yield from geometry['coordinates']
        elif geometry['type'] == 'Polygon':
            yield geometry['coordinates']


country = list(polygons(load('china_country')))
projected = [project(*p[:2]) for polygon in country for ring in polygon for p in ring]
min_x, max_x = min(p[0] for p in projected), max(p[0] for p in projected)
min_y, max_y = min(p[1] for p in projected), max(p[1] for p in projected)
scale = WIDTH / (max_x - min_x)
size = (WIDTH + 2 * PADDING, math.ceil((max_y - min_y) * scale) + 2 * PADDING)
hi_size = tuple(value * AA for value in size)


def points(coordinates):
    return [((x - min_x) * scale * AA + PADDING * AA,
             (y - min_y) * scale * AA + PADDING * AA)
            for x, y in (project(*p[:2]) for p in coordinates)]


mask = Image.new('L', hi_size)
draw = ImageDraw.Draw(mask)
for polygon in country:
    for i, ring in enumerate(polygon):
        draw.polygon(points(ring), fill=0 if i else 255)
image = Image.new('RGBA', hi_size, (192, 216, 238, 0))
image.putalpha(mask.point(lambda a: round(a * 12 / 255)))


def add_lines(lines, color, opacity, thickness, clip=True):
    layer = Image.new('RGBA', hi_size)
    pen = ImageDraw.Draw(layer)
    for line in lines:
        if len(line) > 1:
            pen.line(points(line), fill=(*color, round(opacity)),
                     width=max(1, round(thickness * AA)), joint='curve')
    if clip:
        layer.putalpha(ImageChops.multiply(layer.getchannel('A'), mask))
    image.alpha_composite(layer)


add_lines((ring for polygon in polygons(load('china_provinces')) for ring in polygon),
          (123, 158, 190), 76 * .6, .55 * WIDTH / 1000)
for level in (2, 1, 0):
    lines = []
    for feature in load('china_rivers_l' + str(level + 1)):
        geometry = feature['geometry']
        lines.extend(geometry['coordinates'] if geometry['type'] == 'MultiLineString'
                     else [geometry['coordinates']])
    add_lines(lines, (100, 154, 198), 76 * (1.05, .78, .52)[level],
              (1.65, 1.1, .75)[level] * WIDTH / 1000)
# Bake a smooth outline at the reference desktop map size; dots use live projection.
add_lines((ring for polygon in country for ring in polygon), (119, 157, 192), 76, 4 * WIDTH / 2000, False)
target = ROOT / 'public/backgrounds/blue/map.webp'
# A restrained palette keeps this faint, mostly transparent line drawing small.
image.resize(size, Image.Resampling.LANCZOS).quantize(
    colors=32, method=Image.Quantize.FASTOCTREE
).convert('RGBA').save(target, lossless=True, method=6)
metadata = dict(minX=min_x, maxX=max_x, minY=min_y, maxY=max_y,
                width=WIDTH, padding=PADDING)
(ROOT / 'src/utils/ui/blueBackgroundMapProjection.json').write_text(
    json.dumps(metadata, indent=2) + '\n')
print(f'{target.name}: {size[0]} × {size[1]}, {target.stat().st_size:,} bytes')
