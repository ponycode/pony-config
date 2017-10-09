# Command Line API

**pony-config** provides the following API for collecting configuration
from a unix-style command line interface.

### Define Your Program's Command Line Interface

- short flags, eg. `command -a -b -2`
- long flags, eg. `command --long --silent`
- flags with parameters, eg. `command -o outputfile.bin`
- argument lists, eg. `command -a -o out.txt -- arg1 arg2 arg3`
- read from stdin, eg. `ls -al | command -ac -o out.txt`

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Define the Command Line Interface](#define-the-command-line-interface)
    - [cliFlag( *path*, *flags*, *description*, *[default value]*, *[opt_parser]* )`](#cliflag-path-flags-description-default-value-opt_parser-)
    - [cliArguments( *path* )](#cliarguments-path-)
    - [cliStdin( *path*, *flags | null*, *description*, *[default value]*, *[opt_parser]* )](#clistdin-path-flags--null-description-default-value-opt_parser-)
    - [cliParse()](#cliparse)
- [Command Line Help](#command-line-help)
    - [cliUsage( *message* )](#cliusage-message-)
    - [cliOnHelp( *function* )](#clionhelp-function-)
    - [cliHelpMessage()](#clihelpmessage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Define the Command Line Interface


#### cliFlag( *path*, *flags*, *description*, *[default value]*, *[opt_parser]* )`

- `path` is the config path to store the value
- `flags` is a comma separated list of the flags for this parameter
- `description` will be displayed in the help text
- `default` is the optional default value to store if the flag is not on the command line
- `parser` is an optional function to be called with the input before storing it in the config

If a parser is provided, it should accept a single value and return the value to be
stored at `path`. Examples of common parsers are ParseInt, toLowerCase, splitList etc.

> Input of negative numbers is problematic on a command line, because the *dash* is first interpreted as a flag. This enables
> the use of numerals as flags (eg, -9). The safest way to accept negative input is to use an _equals_ as follows:
> `--value=-9`

#### cliArguments( *path* )

Gathers all inputs after the last flag as an array at the given path.

> input parameters are always attached to the flag to the left of them. After a `--` on the command line
all inputs will be gathered into the arguments.

#### cliStdin( *path*, *flags | null*, *description*, *[default value]*, *[opt_parser]* )

Attempts to read stdin, and if an input pipe is present, reads the data syncronously into a `Buffer`. Data will be stored as a `Buffer` at *path*.

Optionally, set *flags* and *default value* to provide a CLI option for the same *path*. If both `stdin` and a command line flag are provided by your user, the `stdin` will
override the CLI flag. If *flags* is set and neither `stdin` or the CLI flag are provided, the *default value* will be used.

The value read from `stdin` will be a `Buffer` so that binary data may be easily input to your program. You can provide *opt_parser* to convert the data (eg, to a string) before storage.

> `stdin` will be read synchronously until EOF is reached.

#### cliParse()

Commandline parsing can be conditional on the runtime environment. For example `config.when('dev').cliParse()`.

`cliParse` must be called after all other cli configuration functions.

A help flag is defined for you as `-h, --help`. The flags, descriptions and defaults will be output to stdout.


## Command Line Help

Users expect `-h` or `--help` to provide help text for using your program. Help text will be generated for you from the flags and
descriptions provided with the *cliFlags* function.

When the user includes either `-h` or `--help` on the command line, the help text will be printed to stdout and the process will exit.

If you use both `-h` and `--help` flags for your own purposes, then you may want to provide an alternate means to display the help text.

Help text can be customized with the following methods.


#### cliUsage( *message* )

Add a message regarding usage. It will appear with the help text as "Usage: *command* **your message**".


#### cliOnHelp( *function* )

Provide your own help handler. *function* will receive the generated help text as input.

If you do not include an onHelp handler of your own, **pony-config** will log the help text
to `stdout` and call `process.exit(0)`.

#### cliHelpMessage()

Returns the generated help text.
Cloning comes with the cost of memory and cloning-time for each request, so consider the real risk and likelihood of mutations in your code before using *cloneWhenLocked*.

