# Botkit 4.x Docs

This repo contains the source material for the official Botkit 4.x docs.

* [Get Started](index.md)
* [Plugins](plugins/index.md)
* [Platform Adapters](platforms/index.md)
* [Class Reference](reference/index.md)

#### Building the Docs

_Most_ of these documents are automatically generated from the source and by aggregating information from the various adapter and plugin packages.  Do not manually edit files in `platforms/` `plugins/` or `reference/`

To build new versions of these docs, run:

```bash
lerna run build
lerna run build-docs
```
