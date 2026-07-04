"""
Cython wrapper that sets compiler options before invoking the compiler.
Usage: python cython_wrapper.py [--compiler-option key=value ...] [cython args...]

--compiler-option key=value  sets `Cython.Compiler.Options.key = value`
                             before calling cython's main().
"""
import sys

OPTION_PREFIX = '--compiler-option'

compiler_options = {}
cython_args = []

i = 1
while i < len(sys.argv):
    if sys.argv[i] == OPTION_PREFIX and i + 1 < len(sys.argv):
        opt = sys.argv[i + 1]
        if '=' in opt:
            key, raw = opt.split('=', 1)
            if raw.lower() == 'true':
                val = True
            elif raw.lower() == 'false':
                val = False
            else:
                val = raw
            compiler_options[key] = val
        i += 2
    else:
        cython_args.append(sys.argv[i])
        i += 1

sys.argv = ['cython'] + cython_args

import Cython.Compiler.Options as Options

for key, value in compiler_options.items():
    if not hasattr(Options, key):
        print(f"Unknown compiler option: '{key}'", file=sys.stderr)
        sys.exit(1)
    setattr(Options, key, value)

from Cython.Compiler.Main import main
sys.exit(main(command_line=1))
