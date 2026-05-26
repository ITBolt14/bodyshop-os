// ===============================================
// BODYSHOP OS - QR Code Sticker Print Page
// ===============================================

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../../../lib/supabase'
import { ArrowLeft, Printer } from 'lucide-react'

export function QRSticker() {
  
  const { id }      = useParams()
  const navigate    = useNavigate()
  const printRef    = useRef()

  const [job,       setJob]     = useState(null)
  const [vehicle,   setVehicle]  = useState(null)
  const [loading,   setLoading] = useState(true)

  // SECTION: Fetch job and vehicle
  useEffect(() => {
    const fetch = async () => {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, vehicles(*)')
        .eq('id', id)
        .single()

      if (jobData) {
        setJob(jobData)
        setVehicle(jobData.vehicles)
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  // SECTION: Print handler
  const handlePrint = () => window.print()

  // SECTION: QR URL - points to workshop portal job page
  const qrUrl = job?.qr_token
    ? `${window.location.origin}/workshop/job/${job.qr_token}`
    : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600
                        border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) return null

  // SECTIONL: Render
  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* Screen controls - hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/main/jobs/${id}')}
          className="flex items-center gap-2 text-sm text-gray-500
                     hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back to Job
        </button>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2"
        >
          <Printer size={15} /> Print Sticker
        </button>
      </div>

      {/* Sticker - this is what prints */}
      <div
        ref={printRef}
        className="card border-2 border-gray-800 text-center
                   print:shadow-none print:border-2"
      >

        {/* Workshop name */}
        <div className="bg-brand-700 text-white py-2 px-4 -mx-6 -mt-6
                        mb-4 rounded-t-xl">
          <p className="font-bold text-sm tracking-wide">BODYSHOP OS</p>
        </div>

        {/* Job number - large and bold */}
        <p className="text-3xl font-black text-gray-900 tracking-wider mb-1">
          {job.job_number}
        </p>

        {/* Vehicle details */}
        <p className="text-base font-bold text-gray-700 mb-0.5">
          {vehicle?.make} {vehicle?.model}
        </p>
        <p className="text-lg font-black text-brand-700 mb-1">
          {vehicle?.registration}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {vehicle?.owner_name}
        </p>

        {/* QR Code */}
        {qrUrl ? (
          <div className="flex justify-center mb-4">
            <div className="p-3 border-2 border-gray-800 rounded-xl
                            bg-white inline-block">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex
                            items-center justify-center">
              <p className="text-xs text-gray-400">QR not available</p>
            </div>
          </div>
        )}

        {/* Job number below QR - readable without scanning */}
        <p className="text-xs text-gray-400 font-mono mb-1">
          Scan QR or use reference:
        </p>
        <p className="text-xl font-black text-gray-800 tracking-widest mb-1">
          {job.job_number}
        </p>
        <p className="text-sm font-bold text-gray-600 mb-4">
          {vehicle?.registration}
        </p>

        {/* Check in date */}
        <div className="border-t border-gray-200 pt-3 mt-2">
          <p className="text-xs text-gray-400">
            Checked in:{' '}
            {job.check_in_date
              ? new Date(job.check_in_date).toLocaleDateString('en-ZA', {
                day: '2-digit', month: 'long', year: 'numeric'
              })
              : new Date(job.created_at).toLocaleDateString('en-ZA', {
                day: '2-digit', month: 'long', year: 'numeric'
              })
            }
          </p>
        </div>

      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden }
          .card, .card * { visibility: visible; }
          .card {
            position: fixed;
            top: 10mm;
            left: 50%;
            transform: translateX(-50%);
            width: 90mm;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

    </div>
  )
}