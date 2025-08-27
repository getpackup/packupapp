type PageContentProps = {
  children: React.ReactNode
}

const PageContent = ({ children }: PageContentProps) => {
  return <div className="overflow-y-auto">{children}</div>
}

export default PageContent
