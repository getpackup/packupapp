type PageContentProps = {
  children: React.ReactNode
}

const PageContent = ({ children }: PageContentProps) => {
  return <div className="flex-1 overflow-hidden px-8 py-3">{children}</div>
}

export default PageContent
