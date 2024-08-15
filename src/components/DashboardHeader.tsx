import { ChevronDown } from 'lucide-react'
const DashboardHeader = () => {
  return (
    <>
    <div className='flex justify-center items-center gap-2'>
        <p className='text-[12px]'>Tim's Workspace </p>
        <span> <ChevronDown /></span>
    </div>
    </>
  )
}

export default DashboardHeader