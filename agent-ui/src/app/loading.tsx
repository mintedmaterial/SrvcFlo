export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">
          Loading ServiceFlow AI Agent UI...
        </p>
      </div>
    </div>
  )
}