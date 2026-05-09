import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (color: string) => ReturnType
    }
  }
}

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      color: {
        default: '#DBEAFE',
        parseHTML: (el) => el.getAttribute('data-callout-color') ?? '#DBEAFE',
        renderHTML: (attrs) => ({
          'data-callout-color': attrs.color,
          style: `background-color: ${attrs.color}; border-radius: 0.5rem; padding: 0.75rem 1rem; margin: 0.75rem 0;`,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertCallout: (color: string) => ({ commands }) =>
        commands.insertContent({
          type: this.name,
          attrs: { color },
          content: [{ type: 'paragraph' }],
        }),
    }
  },
})
