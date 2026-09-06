<!--
  Source text for the index-page worked example.

  Paste the body below into a new Grammarly document, format it as noted, then
  export it as .docx and save the export as `sample.docx` beside this file. The
  index page runs that .docx through @gramdown/core at build time (both with and
  without code-language guessing), so the panel always shows genuine output.

  Keep each paragraph as ONE line (no manual line breaks inside a paragraph) —
  the editor panel soft-wraps them to its own width.

  Formatting to apply in Grammarly after pasting:
  - "Keeping a changelog by hand"  -> Heading 1
  - "What goes in an entry", "Generating the skeleton"  -> Heading 2
  - The three "Added / Changed / Fixed" lines  -> bulleted list, the lead word bold
  - `commit.subject` (in the prose)  -> inline code / Courier New
  - The indented code lines  -> a code block (Courier New)
  - "Keep a Changelog" -> link to https://keepachangelog.com
-->

# Keeping a changelog by hand

Automated changelogs read like a commit log, because that is what they are. A short summary of each release, written by a person, is far kinder to the people who actually read it: your users.

## What goes in an entry

Group the changes so a reader can jump straight to what they care about:

- **Added** — new features, described in plain language.
- **Changed** — behaviour that works differently now.
- **Fixed** — bugs, with enough detail that a reader can tell whether it affected them.

Keep the newest release at the top and give it a date. Link each version to its release page so the full list of commits is one click away.

## Generating the skeleton

Start from the commits since the last tag and shape them into a rough list, dropping the noise. Each `commit.subject` becomes one bullet:

    const draft = commits
      .filter((commit) => !commit.subject.startsWith("chore"))
      .map((commit) => "- " + commit.subject)
      .join("\n");

Paste that under a new heading and rewrite each line so it reads like a sentence. The [Keep a Changelog](https://keepachangelog.com) format is a good place to start if you want a stricter template.
