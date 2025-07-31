"use client";

import ResumeBuilder from "@/components/ResumeBuilder";
import { ResumeData } from "@/types/resume"; // You will likely need to import the type
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// This helper function might be needed if you don't have one
const generateUUID = () => crypto.randomUUID();

export default function NewResumePage() {
    const { user, loading } = useAuth();

    // Show a loading spinner while checking for a logged-in user
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <LoadingSpinner />
            </div>
        );
    }

    // Create a default empty structure for the new resume
    const newResumeData: ResumeData = {
        id: generateUUID(),
        userId: user?.id || '',
        title: 'Untitled Resume',
        templateId: '', // Will be set when user chooses a template
        isPublic: false,
        personalInfo: {
            firstName: '',
            lastName: '',
            title: '',
            summary: '',
            image: '',
            contact: {
                email: user?.email || '',
                phone: '',
                website: '',
                linkedIn: '',
                github: '',
                // The 'address' property was removed as it's not in the 'Contact' type
            }
        },
        workExperience: [],
        education: [],
        skills: [],
        projects: [],
        languages: [],
        certifications: [],
        interests: [],
        internships: [],
        references: [],
        referenceText: "References available upon request",
        customSections: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_imported: false,
    };

    return (
        <div className="w-full">
            {/* Pass the default data to the builder */}
            <ResumeBuilder initialData={newResumeData} />
        </div>
    );
}