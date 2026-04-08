import { useState, useEffect } from 'react';
import { auth, type User } from '../lib/auth';
import { apiClient } from '../lib/api-client';


interface CompanyData {
    contactPerson: string;
    email: string;
    companyName: string;
}

export function useCourseRequestAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Data to pre-fill the form with once authenticated
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);

    useEffect(() => {
        const fetchClientData = async () => {
            // 1. AUTH FLOW (Mock or Real handled by auth.ts)

            // 2. REAL AUTH FLOW
            const { user } = await auth.getSession();
            setUser(user);
            setIsLoading(false); // Auth check done

            if (user) {
                await fetchProfileData(user);
            }
        };

        // Helper to fetch profile data for a real user
        const fetchProfileData = async (currentUser: User) => {
            try {
                // Fetch client profile to get company information
                const profileResponse = await apiClient.getClientProfile();
                const client = profileResponse.client;

                setCompanyData({
                    contactPerson: currentUser.fullName || client?.userName || currentUser.email?.split('@')[0] || '',
                    email: currentUser.email || client?.companyEmail || '',
                    companyName: client?.companyName || '',
                });
            } catch (error) {
                console.error('Error fetching client profile:', error);
                // Fallback to basic user data if profile fetch fails
                setCompanyData({
                    contactPerson: currentUser.fullName || currentUser.email?.split('@')[0] || '',
                    email: currentUser.email || '',
                    companyName: '',
                });
            }
        };

        fetchClientData();

        // Subscribe to auth changes (for real login/logout)
        const unsubscribe = auth.onAuthStateChange(async (user) => {
            setUser(user);
            if (user) {
                await fetchProfileData(user);
            } else if (!user) {
                setCompanyData(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return { user, isLoading, companyData };
}
