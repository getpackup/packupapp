import { Fragment } from 'react'
import { Link } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb'

type PageHeaderProps = {
  crumbs: {
    label: string
    href: string
  }[]
  actions?: React.ReactNode
}

const PageHeader = ({ crumbs, actions }: PageHeaderProps) => {
  return (
    <div className="border-sidebar-border flex items-center justify-between border-b px-4 md:px-8 py-3">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1

            if (isLast) {
              return (
                <BreadcrumbItem key={crumb.href}>
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                </BreadcrumbItem>
              )
            }

            return (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  <BreadcrumbLink href={crumb.href} asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator key={index} />
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  )
}

export default PageHeader
