import React from 'react';

interface SEBPromptProps {
	examUrl?: string;
	sebConfigUrl?: string;
}

// SEBPrompt removed — keep a no-op component that accepts the original props to avoid breaking imports.
const SEBPrompt: React.FC<SEBPromptProps> = () => null;

export default SEBPrompt;
