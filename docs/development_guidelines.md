# Development guidelines

Also see [Operational guidelines](operational_guidelines.md).

## Documentation

1. The code should speak for itself, but if it doesn't, add comments for clarification - do not duplicate what is obvious from reading the code, that just creates more maintenance and risk of inconsistency.
2. Maintain the README.md and associated docs/* in the root of the project that describes the project and how to use it.

## Python

1. Follow standard coding conventions for Python (PEP8)
2. Use pipenv to manage dependencies

## React

1. Component-based Design: Create new functionality as components; it improves consistency, reusability and maintainability of the code.

## General

1. Don't put technology names in variables, stick to describing what they are to avoid confusion if the technology stack later changes.
   1. Exceptions are when such names are part of the standard vocabulary of the domain, e.g. `docker-compose.yml`.

