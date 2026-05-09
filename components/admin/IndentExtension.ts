import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

const INDENTABLE = ['paragraph', 'heading']

export const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [{
      types: INDENTABLE,
      attributes: {
        indent: {
          default: 0,
          renderHTML: (attrs) => {
            if (!attrs.indent) return {}
            return { style: `padding-left: ${attrs.indent * 1.5}rem` }
          },
          parseHTML: (el) =>
            Math.round(parseFloat(el.style.paddingLeft || '0') / 1.5) || 0,
        },
      },
    }]
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (INDENTABLE.includes(node.type.name)) {
            const level = node.attrs.indent ?? 0
            if (level < 6) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: level + 1 })
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (INDENTABLE.includes(node.type.name)) {
            const level = node.attrs.indent ?? 0
            if (level > 0) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: level - 1 })
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { $from } = editor.state.selection
        for (let d = $from.depth; d > 0; d--) {
          const name = $from.node(d).type.name
          if (['listItem', 'bulletList', 'orderedList'].includes(name)) return false
        }
        return editor.commands.indent()
      },
      'Shift-Tab': ({ editor }) => {
        const { $from } = editor.state.selection
        for (let d = $from.depth; d > 0; d--) {
          const name = $from.node(d).type.name
          if (['listItem', 'bulletList', 'orderedList'].includes(name)) return false
        }
        return editor.commands.outdent()
      },
    }
  },
})
