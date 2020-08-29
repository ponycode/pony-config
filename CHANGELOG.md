# pony-config Change Log


> Version 2.0.2 introduced breaking changes against 2.0.0. Thus we are moving to version 3.0.0, and version 2.0.2 will be unpublished.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [4.0.1 Apr 2020](#401-apr-2020)
- [3.1.0](#310)
- [3.0.1 Aug 2017](#301-aug-2017)
- [3.0.0 July 2017](#300-july-2017)
- [2.0.2 July 2017](#202-july-2017)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 4.0.1 Apr 2020

- removed support for node before 10
- added capability to secure config in the list() output with a regular expression pattern
- resolved dependency vulnerabilities 
- documentation cleanup

## 3.1.0

- added cliStdin() to synchronously read stdin to a config path
- update fs-coalesce dependencies
- modularized documentation

## 3.0.1 Aug 2017

- useRuntimeEnvironment always returns 'this' for chaining
- useRuntimeEnvironment accepts null as input, sets environment to false
- help flags automatically added to command line flags unless user provides -h and --help flags
- unit tests of command line methods

## 3.0.0 July 2017

- Briefer API
    - useObject --> object
    - useFile --> file
    - useEnvironmentVar --> env
    - setOptions --> options
- Reduce ambiguity between runtime environment and environment vars
    - findEnvironment --> findRuntimeEnvironment
    - useEnvironment --> useRuntimeEnvironment
    - isEnvironment --> isRuntimeEnvironment
- New Command Line API
    - useCommandLineArguments and the usageRules are removed
    - cliOption, cliParse, cliArguments replace useCommandLineOptions
    - cliHelp to display help
    - cliUsage to include a usage line in help
    - cliOnHelp to display help with user passes in help flag
- New config sources
    - function( **aFunction** )
        - evaluates function and applies result to config
    - require( **file_path** )
        - requires module and applies result to config

## 2.0.2 July 2017
- Erroneously breaking changes to 2.0.0. Recommend using 3.x.x for new API.
