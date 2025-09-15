import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    const [height, setHeight] = React.useState<number>(40) // Default height

    const textAreaRef = React.useRef<HTMLTextAreaElement>(null)

    const adjustHeight = React.useCallback(() => {
      const textarea = textAreaRef.current
      if (!textarea) return

      // Store current cursor position
      const cursorPosition = textarea.selectionStart

      // Reset height to measure scrollHeight
      textarea.style.height = '40px'
      
      // Calculate new height (between 40px and 96px)
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 96)
      
      setHeight(newHeight)
      textarea.style.height = `${newHeight}px`

      // Restore cursor position
      textarea.setSelectionRange(cursorPosition, cursorPosition)
    }, [])

    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])

    React.useImperativeHandle(ref, () => textAreaRef.current!, [])

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          height > 40 && "overflow-y-auto",
          className
        )}
        ref={textAreaRef}
        style={{ height: `${height}px` }}
        onInput={adjustHeight}
        {...props}
      />
    )
  }
)

TextArea.displayName = "TextArea"

export { TextArea }