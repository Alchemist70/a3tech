#!/usr/bin/env python3
# Fix Remove Option and Remove Explanation button conditions

# Read JAMB file
with open('frontend/src/components/admin/AdminJambTopicDetailsTab.tsx', 'r', encoding='utf-8') as f:
    jamb_content = f.read()

# Apply fixes: Change > 2 to > 1 for Remove Option and Remove Explanation buttons
jamb_fixed = jamb_content.replace(
    '{quiz.options.length > 2 && (',
    '{quiz.options.length > 1 && ('
)
jamb_fixed = jamb_fixed.replace(
    '{quiz.explanations.length > 2 && (',
    '{quiz.explanations.length > 1 && ('
)

# Write back JAMB
with open('frontend/src/components/admin/AdminJambTopicDetailsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(jamb_fixed)

# Create WAEC from JAMB
waec_content = jamb_fixed.replace('jamb-sections', 'waec-sections')
waec_content = waec_content.replace('jamb-topics', 'waec-topics')
waec_content = waec_content.replace('jamb-topic-details', 'waec-topic-details')
waec_content = waec_content.replace('JAMB topic detail', 'WAEC topic detail')
waec_content = waec_content.replace('Manage JAMB', 'Manage WAEC')
waec_content = waec_content.replace('Add JAMB', 'Add WAEC')
waec_content = waec_content.replace('Add New JAMB', 'Add New WAEC')
waec_content = waec_content.replace('AdminJambTopicDetailsTab', 'AdminWaecTopicDetailsTab')
waec_content = waec_content.replace('Failed to add JAMB', 'Failed to add WAEC')
waec_content = waec_content.replace('Failed to update JAMB', 'Failed to update WAEC')
waec_content = waec_content.replace('Failed to delete JAMB', 'Failed to delete WAEC')

with open('frontend/src/components/admin/AdminWaecTopicDetailsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(waec_content)

print('✓ Both files regenerated with fixes applied')
