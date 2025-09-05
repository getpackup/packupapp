type PageContentProps = {
  children: React.ReactNode
}

const PageContent = ({ children }: PageContentProps) => {
  return <div className="flex-1 overflow-hidden">{children}</div>
}

export default PageContent
