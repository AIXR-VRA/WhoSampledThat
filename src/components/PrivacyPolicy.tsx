import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4">
          <DialogPanel className="modern-card w-full max-w-4xl my-8 p-8 relative">
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-3xl font-bold text-white">Privacy Policy & Terms of Service</DialogTitle>
            <button
              onClick={onClose}
              className="modern-button p-2"
              aria-label="Close privacy policy"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="text-gray-300 text-left space-y-6 leading-relaxed">
            <p className="text-sm text-gray-400">Last updated: {currentYear}</p>
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. About This Service</h2>
              <p>
                "Who Sampled That?" is a music guessing game provided as-is for entertainment purposes. 
                This service is not owned or operated by any company and is provided by an individual developer.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Data Collection & Storage</h2>
              <p className="mb-3">
                We do not actively track, collect, or store personal user data. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>No personal information is collected or stored on our servers</li>
                <li>No user accounts or registration required</li>
                <li>Game progress is stored locally in your browser only</li>
                <li>We may use basic analytics services that collect anonymous usage statistics</li>
                <li>Third-party services (YouTube, hosting providers) may have their own data practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Third-Party Services</h2>
              <p className="mb-3">
                This game integrates with YouTube for audio playback. By using this service, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>YouTube's Terms of Service</li>
                <li>YouTube's Privacy Policy</li>
                <li>Google's data practices related to YouTube</li>
              </ul>
              <p className="mt-3">
                We may also use additional third-party services for hosting, analytics, or functionality. 
                These services have their own privacy policies and terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Intellectual Property</h2>
              <p>
                We do not own any of the music content used in this game. All music tracks, samples, 
                and related intellectual property belong to their respective owners. This game is for 
                educational and entertainment purposes under fair use principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Cookies & Local Storage</h2>
              <p>
                This site may use browser local storage to save your game preferences and progress. 
                This data is stored locally on your device and is not transmitted to our servers. 
                You can clear this data through your browser settings at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. EU User Rights (GDPR)</h2>
              <p className="mb-3">
                If you are in the European Union, you have the following rights regarding personal data:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Right to access your data</li>
                <li>Right to correct inaccurate data</li>
                <li>Right to delete your data</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
              </ul>
              <p className="mt-3">
                Since we don't collect or store personal data, these rights are not applicable to this service. 
                Any data-related requests would involve clearing your browser's local storage directly or 
                contacting third-party services (like YouTube) that you interact with.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Terms of Use</h2>
              <p className="mb-3">
                By using this service, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the service for personal, non-commercial purposes</li>
                <li>Not attempt to reverse engineer or extract copyrighted content</li>
                <li>Respect intellectual property rights of music creators and rights holders</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Disclaimer</h2>
              <p>
                This service is provided "as is" without any warranties. We are not responsible for 
                any issues arising from the use of this service, including but not limited to 
                technical problems, content accuracy, or third-party service availability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this privacy policy and terms of service from time to time. 
                The updated date will be reflected at the top of this document.
              </p>
            </section>
          </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
} 