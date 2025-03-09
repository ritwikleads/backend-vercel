"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLoadScript } from "@/hooks/use-load-script"
import { User, Phone, Mail, Home, CloudSunIcon as SolarPanel } from "lucide-react"
import SolarResultsPage from "./solar-results"

// Define types for the calculation result based on the SolarResultsPage component
type PanelSpecs = {
  capacity: string
  dimensions: string
  lifetime: string
}

type SolarPotentialSummary = {
  maximumCapacity: string
  availableArea: string
  sunshine: string
  carbonOffset: string
  panelSpecs: PanelSpecs
}

type FinancingOption = {
  title: string
  description: string
  netCost: number
  savingsYear1: number
  netSavings20yr: number
  paybackYears: number
  rebateValue: number
  propertyValueIncrease: string
  outOfPocketCost: number
  annualLoanPayment?: number
  interestRate?: number
  annualLeasingCost?: number
  payback?: string
  financiallyViable: boolean
  leasesAllowed?: boolean
}

type SolarSystemInfo = {
  solarCoverage: number
  initialEnergyProduction: number
  gridExportPercentage: number
  netMeteringAllowed: boolean
  utilityBillWithoutSolar: number
}

type ElectricityBillInfo = {
  userMonthlyBill: number
  closestAnalyzedBill: number
}

type DataLayers = {
  imageryDate: string
  imageryProcessedDate: string
  imageryQuality: string
  dataLayerUrls: {
    dsmUrl: string
    rgbUrl: string
    maskUrl: string
    annualFluxUrl: string
    monthlyFluxUrl: string
  }
  annualFluxData: {
    contentType: string
    base64Data: string
  }
}

type UserInfo = {
  name: string
  phone: string
  email: string
}

type Location = {
  address: string
  latitude: number
  longitude: number
}

type PropertyInfo = {
  isOwner: boolean
  monthlyElectricityBill: number
}

type CalculationResult = {
  solarData: {
    solarPotentialSummary: SolarPotentialSummary
    financingOptions: {
      cashPurchase: FinancingOption
      loan: FinancingOption
      lease: FinancingOption
    }
    solarSystemInfo: SolarSystemInfo
    recommendedPanels: number
    electricityBillInfo: ElectricityBillInfo
    userInfo: UserInfo
    location: Location
    propertyInfo: PropertyInfo
  }
  dataLayers: DataLayers
}

declare global {
  interface Window {
    google: typeof google
  }
}

type FormData = {
  name: string
  phone: string
  email: string
  address: string
  latitude: number | null
  longitude: number | null
  isOwner: string
  electricityBill: number
}

export default function SolarCalculatorForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    latitude: null,
    longitude: null,
    isOwner: "",
    electricityBill: 100,
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  // Define libraries array outside of component render to keep it stable
  const libraries = ["places"] as ["places"]

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyD_CcjWBJsOhjZ98B9GidVKu9VL7TAYvgQ",
    libraries,
  })

  useEffect(() => {
    if (isLoaded && currentStep === 4) {
      const addressInput = document.getElementById("address") as HTMLInputElement
      if (addressInput) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInput, {
          types: ["address"],
          componentRestrictions: { country: "us" },
        })

        autocompleteInstance.addListener("place_changed", () => {
          const place = autocompleteInstance.getPlace()
          const location = place.geometry?.location
          const address = place.formatted_address || ""
          if (location && address) {
            setFormData((prev) => ({
              ...prev,
              address,
              latitude: location.lat(),
              longitude: location.lng()
            }))
          } else {
            setErrors((prev) => ({
              ...prev,
              address: "Please select a valid address with location data"
            }))
          }
        })

        setAutocomplete(autocompleteInstance)
      }
    }
  }, [isLoaded, currentStep])

  const totalSteps = 6
  const progress = isSubmitting ? 100 : ((currentStep - 1) / totalSteps) * 100

  const validateStep = () => {
    const newErrors: Partial<FormData> = {}

    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Name is required"
        break
      case 2:
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required"
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
          newErrors.phone = "Please enter a valid 10-digit phone number"
        }
        break
      case 3:
        if (!formData.email.trim()) {
          newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address"
        }
        break
      case 4:
        if (!formData.address.trim()) {
          newErrors.address = "Address is required"
        }
        if (!formData.latitude || !formData.longitude) {
          newErrors.address = "Please select an address from the suggestions"
        }
        break
      case 5:
        if (!formData.isOwner) newErrors.isOwner = "Please select an option"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '')
      // Format as (XXX) XXX-XXXX
      let formattedValue = digitsOnly
      if (digitsOnly.length > 0) {
        formattedValue = digitsOnly.length <= 3 ? `(${digitsOnly}` : `(${digitsOnly.slice(0, 3)}`
        if (digitsOnly.length > 3) {
          formattedValue += `) ${digitsOnly.slice(3, 6)}`
          if (digitsOnly.length > 6) {
            formattedValue += `-${digitsOnly.slice(6, 10)}`
          }
        }
      }
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof FormData]
        return newErrors
      })
    }
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, isOwner: value }))
    // Clear error when user makes a selection
    if (errors.isOwner) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.isOwner
        return newErrors
      })
    }
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, electricityBill: value[0] }))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setIsSubmitting(true)
    try {
      const submissionData = {
        userInfo: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
        location: {
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        propertyInfo: {
          isOwner: formData.isOwner === 'yes',
          monthlyElectricityBill: formData.electricityBill,
        }
      }

      console.log('Submitting data:', JSON.stringify(submissionData, null, 2))

      const response = await fetch("https://backend-vercel-eosin-ten.vercel.app/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate solar savings')
      }

      const result = await response.json()
      console.log('API Response:', JSON.stringify(result, null, 2))
      
      setCalculationResult(result)
      setShowResults(true)
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("There was an error calculating your solar savings. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "What's your name?"
      case 2:
        return "What's your phone number?"
      case 3:
        return "What's your email address?"
      case 4:
        return "What's your home address?"
      case 5:
        return "Are you the owner of the house?"
      case 6:
        return "What's your average monthly electricity bill?"
      default:
        return ""
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{getStepTitle(currentStep)}</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{getStepTitle(currentStep)}</h2>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  maxLength={14}
                  className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{getStepTitle(currentStep)}</h2>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{getStepTitle(currentStep)}</h2>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Start typing your address"
                  className={`pl-10 ${errors.address ? "border-red-500" : ""}`}
                  disabled={!isLoaded}
                />
              </div>
              {loadError && <p className="text-amber-500 text-sm">Address autocomplete could not be loaded</p>}
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{getStepTitle(currentStep)}</h2>
            <RadioGroup value={formData.isOwner} onValueChange={handleRadioChange} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="owner-yes" />
                <Label htmlFor="owner-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="owner-no" />
                <Label htmlFor="owner-no">No</Label>
              </div>
            </RadioGroup>
            {errors.isOwner && <p className="text-red-500 text-sm">{errors.isOwner}</p>}
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{getStepTitle(currentStep)}</h2>
            <div className="space-y-6">
              <Slider
                defaultValue={[formData.electricityBill]}
                min={10}
                max={1000}
                step={10}
                onValueChange={handleSliderChange}
                className="mb-6"
              />
              <div className="text-center">
                <span className="text-4xl font-bold text-green-600">${formData.electricityBill}</span>
                <p className="text-sm text-gray-500 mt-2">
                  Move the slider to select your average monthly electricity bill
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (showResults && calculationResult) {
    return (
      <SolarResultsPage 
        calculationResult={calculationResult}
        onBackToForm={() => setShowResults(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <SolarPanel className="inline-block h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Solar Savings Calculator</h1>
        </div>
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {renderStepContent()}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center px-4 py-2"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep === totalSteps ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-green-500 hover:bg-green-600 text-white"
              >
                {isSubmitting ? "Calculating..." : "Calculate Savings"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-green-500 hover:bg-green-600 text-white"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

