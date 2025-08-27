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
}

const PageHeader = ({ crumbs }: PageHeaderProps) => {
  return (
    <div className="border-sidebar-border flex items-center border-b px-8 py-3">
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
    </div>
  )
}

export default PageHeader
