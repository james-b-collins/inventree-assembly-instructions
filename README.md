# inventree-assembly-instructions

An [InvenTree](https://inventree.org) plugin that adds an **Assembly Instructions** panel to part pages, showing embedded video and formatted notes directly on the page.

The panel appears automatically when a part has a video attachment or non-empty notes, and hides itself when neither is present.

## Features

- Embeds video attachments (MP4, WebM, OGG, MOV, AVI, MKV) directly in the part page with a full HTML5 player
- Renders the part's Notes field as formatted text beneath the video
- Panel is hidden automatically when no video or notes are present
- No configuration required

## Requirements

- InvenTree 1.3.0 or newer
- Plugin interface enabled (`ENABLE_PLUGINS_INTERFACE` setting)

## Installation

Install directly from GitHub:

```bash
pip install git+https://github.com/james-b-collins/inventree-assembly-instructions.git
```

Or add to your `plugins.txt` for automatic installation:

```
git+https://github.com/james-b-collins/inventree-assembly-instructions.git
```

Then enable the plugin in **Settings → Admin Center → Plugins**.

## Usage

1. Navigate to any part page
2. Upload a video file via the **Attachments** tab, or add text to the **Notes** field
3. The **Assembly Instructions** tab will appear automatically in the left hand tabs

## Contributing

Issues and PRs welcome. 
- Please include inventree version and a description of which files were attached when submitting an issue

Future Ideas for expanding plugin:
- PDF attachment rendering inline
- YouTube embed support
- Support for multiple videos per part

## License

MIT - see [LICENSE](LICENSE)

## Author

James Collins - [Simcore](https://simcore.com.au)
