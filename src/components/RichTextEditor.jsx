import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { FontSize } from '../lib/fontSizeExtension.js'

const FONT_SIZES = [
  { label: '크기', value: '' },
  { label: '작게', value: '13px' },
  { label: '보통', value: '16px' },
  { label: '크게', value: '20px' },
  { label: '아주 크게', value: '28px' },
]

/**
 * 제어되지 않는(uncontrolled) 에디터입니다. 초기값은 defaultValue로만 넣고,
 * 이후 변화는 onChange(html)로만 부모에 전달합니다.
 * onReady(editor)로 Tiptap 인스턴스 자체를 부모에 넘겨서,
 * 부모가 이미지 삽입·초기화(clearContent) 등을 직접 제어할 수 있게 합니다.
 */
export default function RichTextEditor({ defaultValue = '', onChange, onReady, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Image.configure({ inline: false, HTMLAttributes: { class: 'rte-image' } }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'rte-content',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor) onReady?.(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button
          type="button"
          className={editor.isActive('bold') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={editor.isActive('strike') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </button>
        <span className="rte-toolbar__sep" />
        <select
          defaultValue=""
          onChange={(e) => {
            const size = e.target.value
            if (size) {
              editor.chain().focus().setFontSize(size).run()
            } else {
              editor.chain().focus().unsetFontSize().run()
            }
            e.target.value = ''
          }}
        >
          {FONT_SIZES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
