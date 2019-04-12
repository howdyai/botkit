# Instructions for Contributing Code

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Submitting Issues

* You can create an issue [here](https://github.com/howdyai/botkit/issues/new),
but before doing that please read the notes below and include as many details as
possible with your report. If you can, please include:
  * The version of Botkit you are using
  * The operating system you are using
  * If applicable, what you were doing when the issue arose and what you
  expected to happen
* Other things that will help resolve your issue:
  * Screenshots and animated GIFs
  * Error output that appears in your terminal, dev tools or as an alert
  * Perform a [cursory search](https://github.com/howdyai/botkit/issues?utf8=✓&q=is%3Aissue+)
  to see if a similar issue has already been submitted

## Submitting Pull Requests

* Pull requests should contain a concise topic and detailed accompanying text that clearly identifies both the purpose and justification for acceptance of any changes.
* Create, or link to an existing issue identifying the need driving your PR request. The issue can contain more details of the need for the PR as well as host debate as to which course of action the PR will take that will most serve the common good.
* Include screenshots and animated GIFs in your pull request whenever possible.
* Run `npm test` before submitting and fix any issues.
* Add tests to cover any new functionality. Add and/or update tests for any updates to the code.
* Write documentation in [Markdown](https://daringfireball.net/projects/markdown).
* Please follow, [JSDoc](http://usejsdoc.org/) for proper documentation.
* Use short, present tense commit messages. See [Commit Message Styleguide](#git-commit-messages).

## Styleguides

### General Code

* End files with a newline.
* Place requires in the following order:
  * Built in Node Modules (such as `path`)
  * Local Modules (using relative paths)
* Avoid platform-dependent code:
  * Use `path.join()` to concatenate filenames.
* Using a plain `return` when returning explicitly at the end of a function.
  * Not `return null`, `return undefined`, `null`, or `undefined`

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally
