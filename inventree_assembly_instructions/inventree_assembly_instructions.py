from plugin import InvenTreePlugin
from plugin.mixins import UserInterfaceMixin

class AssemblyInstructionsPlugin(UserInterfaceMixin, InvenTreePlugin):
    NAME = "AssemblyInstructions"
    SLUG = "assembly-instructions"
    TITLE = "Assembly Instructions"
    DESCRIPTION = "Shows assembly instructions as optional embedded video or notes"
    VERSION = "1.1.0"
    AUTHOR = "James Collins"
    WEBSITE = "https://github.com/james-b-collins/inventree-assembly-instructions"
    LICENSE = "MIT"

    def get_ui_panels(self, request, context, **kwargs):
        instance_id = context.get('target_id')
        model = context.get('target_model', '')

        if model != 'part' or not instance_id:
            return []

        return [
            {
                'key': 'assembly-instructions',
                'title': 'Assembly Instructions',
                'icon': 'ti:video:outline',
                'source': f'{self.plugin_static_file("assembly_instructions/panel.js")}?v={self.VERSION}:renderPanel',
            }
        ]
