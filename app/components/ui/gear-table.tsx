import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/table-core'

import type { GearItem } from '~/types/GearItem'

// TODO add sorting
// TODO add weight selection and weight units
export default function GearTable({
  data,
  // columns,
  // hasPagination,
}:
{
  data: GearItem[]
  // columns: ColumnDef < GearItem > []
  // hasPagination ? : boolean
}
) {
  // Let's construct a table
  const columnHelper = createColumnHelper<GearItem>()
  const columns: ColumnDef<GearItem, any>[] = [
    columnHelper.accessor('name', {
      cell: info => info.getValue(),
      header: 'Name',
      // footer: info => info.column.id
    }),
    columnHelper.accessor('category', {
      cell: info => info.renderValue(),
      header: 'Category'
    }),
    columnHelper.accessor('weight', {
      cell: info => info.renderValue(),
      header: 'Weight'
    })
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <table className="w-full">
      <thead>
        <tr>
          {table.getFlatHeaders().map(header => (
            <th key={header.id} className="text-start p-1">
              {
                flexRender(
                  header.column.columnDef.header as string,
                  header.getContext()
                )
              }
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
      {data.length > 0 && table.getRowModel().rows.map((row) => {
        return (
          <tr className='py-2 transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:cursor-pointer' key={row.id}>
            {row.getVisibleCells().map((cell) => {
              return (
                <td className='p-1' key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              )
            })}
          </tr>
        )
      })}
      </tbody>
    </table>
  )
}