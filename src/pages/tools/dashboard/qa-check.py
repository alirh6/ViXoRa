#!/usr/bin/env python3
# QA dashboard - static coverage checks
import re, os, sys
D = os.path.dirname(os.path.abspath(__file__))
def read(f):
    with open(os.path.join(D, f), encoding='utf-8') as fh:
        return fh.read()
fails, warns, oks = [], [], []
def check(name, cond, detail=''):
    (oks if cond else fails).append(name)
    if not cond:
        print('  FAIL: ' + name + ' :: ' + str(detail)[:300])

print('=== meta/layout/views ===')
WF = ['dash-widgets.js', 'dash-widgets2.js', 'dash-widgets3.js', 'dash-widgets4.js',
      'dash-widgets5.js', 'dash-widgets6.js', 'dash-widgets7.js', 'dash-widgets8.js',
      'dash-widgets9.js', 'dash-widgets10.js', 'dash-widgets11.js', 'dash-widgets12.js']
metas = {}
for f in WF:
    s = read(f)
    m = re.search('export const [A-Z0-9_]*META[A-Z0-9_]* =' , s)
    ids = []
    if m:
        body = s[m.end():m.end()+6000]
        ids = re.findall(r"'([\w-]+)':\s*\{\s*title", body)
    metas[f] = ids
    print('  %s: %d' % (f, len(ids)))
all_meta = [i for v in metas.values() for i in v]
print('  META TOTAL: %d' % len(all_meta))
check('no duplicate widget ids', len(all_meta) == len(set(all_meta)),
      [k for k in set(all_meta) if all_meta.count(k) > 1])
state = read('dash-state.js')
layout_ids = re.findall(r"\{ id: '([\w-]+)', size:", state.split('DEFAULT_LAYOUT')[1].split('];')[0])
check('layout ids all in meta', all(i in all_meta for i in layout_ids),
      [i for i in layout_ids if i not in all_meta])
check('no duplicate layout ids', len(layout_ids) == len(set(layout_ids)),
      [k for k in set(layout_ids) if layout_ids.count(k) > 1])
nolayout = [i for i in all_meta if i not in layout_ids]
if nolayout:
    warns.append('meta without layout: %s' % nolayout)
views = re.findall(r"\{ id: '([\w-]+)', title:", state.split('DASH_VIEWS')[1].split('];')[0])
print('  views(%d): %s' % (len(views), views))
dash = read('toolsDashboard.js')
for v in views:
    check('view body: ' + v, ("ui.view === '%s'" % v) in dash, 'no bodyHtml case')

print('=== render coverage ===')
for f in WF:
    s = read(f)
    cases = set(re.findall(r"case '([\w-]+)':", s))
    # base file may also use direct if-render; count if-chains too
    cases |= set(re.findall(r"id === '([\w-]+)'", s))
    for i in metas[f]:
        if i not in cases:
            fails.append('%s: meta "%s" has no render case' % (f, i))
print('  render fails: %d' % len([f for f in fails if 'no render case' in f]))

print('=== guide chapters ===')
guide = read('dash-guide.js')
base_ch = re.findall(r"\{ id: '([\w-]+)', icon:", guide.split('GUIDE_CHAPTERS_BASE')[1].split('];')[0])
base_keys = re.findall(r'^  ([\w-]+): \[', guide, re.M)
check('base chapters have keys', all(c in base_keys or c in ('recipes', 'gloss') for c in base_ch),
      [c for c in base_ch if c not in base_keys])
total_ch = len(base_ch)
for ext in ['2a', '2b', '2c', '2d', '2e', '2f', '2g', '2h', '2i']:
    s = read('dash-guide%s.js' % ext)
    chs = re.findall(r"\{ id: '([\w-]+)', icon:", s)
    keys = re.findall(r"^  '([\w-]+)': \[", s, re.M)
    total_ch += len(chs)
    for c in chs:
        check('guide%s key: %s' % (ext, c), c in keys, 'missing GUIDE key')
print('  guide chapters total: %d' % total_ch)

print('=== actions coverage ===')
actions = set()
for f in os.listdir(D):
    if f.endswith('.js'):
        actions |= set(re.findall(r'data-action="([\w-]+)"', read(f)))
actions |= set(re.findall(r"data-action='([\w-]+)'", dash))
print('  unique data-actions: %d' % len(actions))
handled = set(re.findall(r"action === '([\w-]+)'", dash))
handled |= {'cmdk-run', 'cmdk-calc', 'cmdk-close', 'gal-toggle', 'gal-close', 'open-gallery', 'open-cmdk',
            'cycle-theme', 'reload', 'show-credit', 'credit-close', 'credit-copy', 'view', 'go',
            'w-size', 'w-hide', 'w-focus', 'w-unfocus', 'guide-ch', 'guide-goto'}
for f in ['dash-actions.js', 'dash-widgets5.js', 'dash-widgets6.js', 'dash-widgets7.js', 'dash-widgets8.js',
          'dash-widgets9.js', 'dash-widgets10.js', 'dash-widgets11.js', 'dash-widgets12.js', 'dash-remote.js',
          'dash-journal.js', 'dash-calendar.js', 'dash-habits.js', 'dash-focus.js', 'dash-goals.js',
          'dash-review.js', 'dash-report.js', 'dash-settings.js', 'dash-tour.js', 'dash-credit.js',
          'dash-cmdk.js', 'dash-guide.js', 'dash-charts.js', 'dash-export.js',
          'dash-themes.js', 'dash-notify.js', 'dash-insights.js', 'dash-achieve.js', 'dash-automate.js']:
    handled |= set(re.findall(r"case '([\w-]+)':", read(f)))
    handled |= set(re.findall(r"action === '([\w-]+)'", read(f)))
    handled |= set(re.findall(r"closest\(\s*['\"]\[data-action=\\?\"([\w-]+)", read(f)))
prefixes = ['w-', 'r-', 'j-', 'cal-', 'hb-', 'f-', 'gl-', 'rv-', 'rp-', 'set-', 'tour-', 'wc-', 'guide-']
unhandled = sorted(a for a in actions if a not in handled and not any(a.startswith(p) for p in prefixes))
if unhandled:
    fails.append('unhandled actions: %s' % unhandled)
    print('  UNHANDLED: %s' % unhandled)
else:
    oks.append('all data-actions handled')
    print('  all data-actions handled OK')
alljs = ''.join(read(f) for f in os.listdir(D) if f.endswith('.js'))
targets = set(re.findall(r'data-action="view" data-v="([\w-]+)"', alljs))
bad = [t for t in targets if t not in views]
check('goto-view targets valid', not bad, bad)

print('=== cmdk/recipes/glossary ===')
cmdk = read('dash-cmdk.js')
cids = re.findall(r"add\('([\w-]+)',", cmdk)
print('  cmdk commands: %d' % len(cids))
check('cmdk ids unique', len(cids) == len(set(cids)), [k for k in set(cids) if cids.count(k) > 1])
print('  recipes: %d' % read('dash-recipes.js').count('\n  R('))
print('  glossary: %d' % read('dash-glossary.js').count('\n  G('))
print()
print('passed: %d | failed: %d | warnings: %d' % (len(oks), len(fails), len(warns)))
for w in warns:
    print('  WARN: ' + w)
sys.exit(1 if fails else 0)
