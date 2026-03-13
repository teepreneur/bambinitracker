import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import { useState } from 'react';

export function useDoctorSummary() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateDoctorSummary = async (childId: string): Promise<string> => {
        setIsGenerating(true);
        try {
            // 1. Fetch Child Profile
            const { data: child, error: childError } = await supabase
                .from('children')
                .select('*')
                .eq('id', childId)
                .single();

            if (childError || !child) throw new Error("Could not fetch child profile");

            const today = new Date();
            const dob = new Date(child.dob);
            const ageMonths = Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

            // 2. Fetch Latest Growth
            const { data: growth } = await supabase
                .from('growth_measurements')
                .select('*')
                .eq('child_id', childId)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            // 3. Fetch Recent Emerging/Achieved Milestones
            const { data: milestonesData } = await supabase
                .from('child_milestones')
                .select(`
                    status,
                    milestones_catalog(title, domain)
                `)
                .eq('child_id', childId)
                .in('status', ['emerging', 'achieved'])
                .order('updated_at', { ascending: false })
                .limit(10);

            const milestones = milestonesData as any[] | null;

            // 4. Fetch Recent Health Logs (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: healthLogs } = await supabase
                .from('health_logs')
                .select('*')
                .eq('child_id', childId)
                .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('log_date', { ascending: false });

            // 5. Fetch Upcoming/Recent Vaccinations
            const { data: vaccines } = await supabase
                .from('vaccinations')
                .select('*')
                .eq('child_id', childId)
                .order('given_date', { ascending: false })
                .limit(5);

            // --- HTML TEMPLATE GENERATION ---

            const brandColor = '#A67BB5';
            const secondaryColor = '#8E8E93';
            const bgColor = '#f9f5ea';

            let milestonesHtml = '';
            if (milestones && milestones.length > 0) {
                const emerging = milestones.filter(m => m.status === 'emerging').map(m => (m.milestones_catalog as any).title);
                const achieved = milestones.filter(m => m.status === 'achieved').map(m => (m.milestones_catalog as any).title);
                
                milestonesHtml = `
                    <div class="section">
                        <div class="section-title">⭐ Developmental Milestones</div>
                        ${emerging.length > 0 ? `<p><strong>Working On:</strong> ${emerging.join(', ')}</p>` : ''}
                        ${achieved.length > 0 ? `<p><strong>Recently Achieved:</strong> ${achieved.join(', ')}</p>` : ''}
                    </div>
                `;
            }

            let healthLogsHtml = '';
            if (healthLogs && healthLogs.length > 0) {
                healthLogsHtml = `
                    <div class="section">
                        <div class="section-title">🤒 Recent Health Observations (30 Days)</div>
                        <table>
                            <tr><th>Date</th><th>Symptom</th><th>Severity</th><th>Notes</th></tr>
                            ${healthLogs.map(log => `
                                <tr>
                                    <td>${format(new Date(log.log_date), 'MMM d')}</td>
                                    <td>${log.symptoms?.join(', ')}</td>
                                    <td>${log.severity}</td>
                                    <td>${log.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `;
            }

            let vaccinesHtml = '';
            if (vaccines && vaccines.length > 0) {
                vaccinesHtml = `
                    <div class="section">
                        <div class="section-title">💉 Recent Vaccinations</div>
                        <table>
                            <tr><th>Date</th><th>Vaccine</th><th>Dose</th></tr>
                            ${vaccines.map(v => `
                                <tr>
                                    <td>${format(new Date(v.given_date), 'MMM d')}</td>
                                    <td>${v.vaccine_name}</td>
                                    <td>${v.dose_number}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `;
            }

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { 
                            font-family: 'Helvetica', 'Arial', sans-serif; 
                            background-color: ${bgColor}; 
                            color: #333; 
                            padding: 40px; 
                            line-height: 1.6;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 40px; 
                            border-bottom: 2px solid ${brandColor};
                            padding-bottom: 20px;
                        }
                        .header h1 { color: ${brandColor}; margin: 0; font-size: 32px; }
                        .header p { color: ${secondaryColor}; margin: 5px 0 0; }
                        
                        .profile-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin-bottom: 30px;
                        }
                        
                        .section { 
                            background: white; 
                            padding: 24px; 
                            border-radius: 24px; 
                            margin-bottom: 24px; 
                            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                        }
                        .section-title { 
                            font-size: 20px; 
                            font-weight: bold; 
                            color: ${brandColor}; 
                            margin-bottom: 16px; 
                            display: flex;
                            align-items: center;
                        }
                        
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th { text-align: left; color: ${secondaryColor}; font-size: 12px; text-transform: uppercase; padding: 8px 0; border-bottom: 1px solid #eee; }
                        td { padding: 12px 0; border-bottom: 1px solid #f9f9f9; font-size: 14px; }
                        
                        .footer { text-align: center; margin-top: 60px; color: ${secondaryColor}; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Bambini Tracker</h1>
                        <p>Doctor Visit Report • ${format(today, 'MMMM d, yyyy')}</p>
                    </div>

                    <div class="section">
                        <div class="section-title">👤 Child Profile</div>
                        <div class="profile-grid">
                            <div>
                                <p><strong>Name:</strong> ${child.name}</p>
                                <p><strong>DOB:</strong> ${format(dob, 'MMMM d, yyyy')}</p>
                                <p><strong>Age:</strong> ${ageMonths} months</p>
                            </div>
                            <div>
                                <p><strong>Blood Type:</strong> ${child.blood_type || 'N/A'}</p>
                                <p><strong>Allergies:</strong> ${child.allergies?.join(', ') || 'None'}</p>
                            </div>
                        </div>
                    </div>

                    ${growth ? `
                        <div class="section">
                            <div class="section-title">📈 Latest Growth Measurements</div>
                            <div class="profile-grid">
                                <div><p><strong>Weight:</strong> ${growth.weight_kg || '-'} kg</p></div>
                                <div><p><strong>Height:</strong> ${growth.height_cm || '-'} cm</p></div>
                                <div><p><strong>Head Circum.:</strong> ${growth.head_circumference_cm || '-'} cm</p></div>
                                <div><p><strong>Date:</strong> ${format(new Date(growth.date), 'MMM d, yyyy')}</p></div>
                            </div>
                        </div>
                    ` : ''}

                    ${milestonesHtml}
                    ${vaccinesHtml}
                    ${healthLogsHtml}

                    <div class="footer">
                        <p>This report was generated by the Bambini Tracker App.</p>
                        <p>It is intended for informational use during medical consultations.</p>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            return uri;

        } catch (error) {
            console.error("Error generating doctor summary:", error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    return { generateDoctorSummary, isGenerating };
}
