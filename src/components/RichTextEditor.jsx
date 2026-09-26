import { useEffect, useState } from 'react'
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
 *
 * "코드 보기"를 켜면 서식 화면 대신 HTML 소스를 그대로 보여주는 textarea로 바뀌고,
 * 직접 태그를 써서 편집할 수 있습니다. 다시 끄면 그 코드가 서식(굵게/이미지 등)으로
 * 반영된 화면으로 전환됩니다. 저장되는 값(HTML)은 두 모드 어느 쪽에서 편집해도 동일해요.
 */
export default function RichTextEditor({ defaultValue = '', onChange, onReady, placeholder }) {
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceValue, setSourceValue] = useState('')

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

  function enterSourceMode() {
    setSourceValue(editor.getHTML())
    setSourceMode(true)
  }

  function exitSourceMode() {
    // 두 번째 인자(true)를 줘야 이 변경이 onUpdate(=onChange)로도 전달돼요.
    editor.commands.setContent(sourceValue, true)
    setSourceMode(false)
  }

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button
          type="button"
          className={editor.isActive('bold') ? 'active' : ''}
          disabled={sourceMode}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'active' : ''}
          disabled={sourceMode}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={editor.isActive('strike') ? 'active' : ''}
          disabled={sourceMode}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </button>
        <span className="rte-toolbar__sep" />
        <select
          defaultValue=""
          disabled={sourceMode}
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
        <span className="rte-toolbar__sep" />
        <button
          type="button"
          className={sourceMode ? 'active rte-toolbar__code-btn' : 'rte-toolbar__code-btn'}
          onClick={() => (sourceMode ? exitSourceMode() : enterSourceMode())}
        >
          {'</>'} {sourceMode ? '미리보기' : '코드 보기'}
        </button>
      </div>

      {sourceMode ? (
        <textarea
          className="rte-source"
          value={sourceValue}
          onChange={(e) => {
            setSourceValue(e.target.value)
            onChange?.(e.target.value)
          }}
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
