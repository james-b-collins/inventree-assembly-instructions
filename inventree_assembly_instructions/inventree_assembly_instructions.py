from plugin import InvenTreePlugin
from plugin.mixins import UserInterfaceMixin

VIDEO_EXTENSIONS = {'.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'}


def _has_content(part_id: int) -> bool:
    """Return True if this part has a video attachment or non-empty notes."""
    try:
        from part.models import Part
        part = Part.objects.get(pk=part_id)
        if part.notes and part.notes.strip():
            return True
    except Exception:
        pass

    try:
        from common.models import Attachment
        attachments = Attachment.objects.filter(model_type='part', model_id=part_id)
    except Exception:
        try:
            from part.models import PartAttachment
            attachments = PartAttachment.objects.filter(part_id=part_id)
        except Exception:
            return True

    for a in attachments:
        if any(str(a.attachment).lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
            return True
    return False


class AssemblyInstructionsPlugin(UserInterfaceMixin, InvenTreePlugin):
    NAME = "AssemblyInstructions"
    SLUG = "assembly-instructions"
    TITLE = "Assembly Instructions"
    DESCRIPTION = "Shows assembly instructions as optional embedded video or notes"
    VERSION = "0.1.2"
    AUTHOR = "James Collins"
    WEBSITE = "https://github.com/james-b-collins/inventree-assembly-instructions"
    LICENSE = "MIT"

    def get_ui_panels(self, request, context, **kwargs):
        instance_id = context.get('target_id')
        model = context.get('target_model', '')

        if model != 'part' or not instance_id:
            return []

        if not _has_content(int(instance_id)):
            return []

        return [
            {
                'key': 'assembly-instructions',
                'title': 'Assembly Instructions',
                'icon': 'ti:video:outline',
                'source': f'{self.plugin_static_file("assembly_instructions/panel.js")}?v={self.VERSION}:renderPanel',
            }
        ]
