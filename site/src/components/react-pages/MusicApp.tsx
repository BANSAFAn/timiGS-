import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, Plus, LogIn, Github, ExternalLink, Music, Headphones, AlertCircle } from 'lucide-react';
import { signIn, signOut } from 'auth-astro/client';
import type { Translation, Language } from '../../i18n/types';

interface Track {
    id: number;
    title: string;
    artist: string;
    genre: string;
    duration: string;
    url: string;
    status: 'verified' | 'pending';
}

interface MusicAppProps {
    lang: Language;
    t: Translation;
    session: any;
}

const MusicApp: React.FC<MusicAppProps> = ({ lang, t, session }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [playing, setPlaying] = useState<number | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    
    // Auth & Submit State
    const isLoggedIn = !!session;
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', artist: '', genre: '', url: '' });

    useEffect(() => {
        // Fetch verified music
        fetch('/music.json')
            .then(res => res.json())
            .then(data => {
                setTracks(data.filter((track: Track) => track.status === 'verified'));
            })
            .catch(err => console.error("Error loading music catalog:", err));
    }, []);

    const togglePlay = (track: Track) => {
        if (playing === track.id) {
            audio?.pause();
            setPlaying(null);
            return;
        }

        if (audio) {
            audio.pause();
        }

        const newAudio = new Audio(track.url);
        newAudio.play().catch(e => console.error("Error playing audio", e));
        
        newAudio.onended = () => setPlaying(null);
        
        setAudio(newAudio);
        setPlaying(track.id);
    };

    const handleLogin = () => {
        signIn();
    };

    const handleLogout = () => {
        signOut();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Since we are strictly a NextJS/Astro static site without a database,
        // we redirect the user to create a pre-filled GitHub issue on the repo.
        const issueTitle = `Music Submission: ${formData.title} by ${formData.artist}`;
        const issueBody = `
### 🎵 New Music Submission

**Title**: ${formData.title}
**Artist**: ${formData.artist}
**Genre**: ${formData.genre}
**Streaming / Download URL**: ${formData.url}

---
*Submitted via TimiGS Music Portal*
        `;

        const githubUrl = `https://github.com/BANSAFAn/timiGS-/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
        window.open(githubUrl, '_blank');
        
        setShowSubmitModal(false);
        setFormData({ title: '', artist: '', genre: '', url: '' });
    };

    return (
        <div className="min-h-screen bg-apple-gray-950 pt-32 pb-24 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4 flex items-center gap-4">
                            TimiGS Music 
                            <span className="px-3 py-1 bg-apple-blue/10 text-apple-blue text-sm rounded-full font-mono border border-apple-blue/20">BETA</span>
                        </h1>
                        <p className="text-apple-gray-400 max-w-2xl text-lg">
                            A curated community collection of focus-enhancing music for your work sessions.
                            Listen natively or submit your own tracks for review!
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {!isLoggedIn ? (
                            <button 
                                onClick={handleLogin}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                Sign In / Sign Up
                            </button>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl mr-2">
                                    {session?.user?.image && (
                                        <img src={session.user.image} alt="User Avatar" className="w-8 h-8 rounded-full" />
                                    )}
                                    <span className="text-sm font-medium text-white hidden sm:block">
                                        {session?.user?.name?.split(' ')[0] || 'User'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setShowSubmitModal(true)}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-apple-blue text-white font-semibold rounded-xl shadow-lg shadow-apple-blue/20 hover:bg-apple-blue/90 hover:scale-105 transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Submit Track
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="px-4 py-3 bg-white/5 border border-white/10 text-apple-gray-400 font-medium rounded-xl hover:bg-white/10 transition-all hover:text-white"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Submit Modal */}
                {showSubmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-apple-gray-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Headphones className="w-5 h-5 text-apple-blue" />
                                    Submit Music
                                </h3>
                                <p className="text-sm text-apple-gray-400 mt-2">
                                    All submissions are verified via GitHub before appearing on the site. You will be redirected to create a Pull Request or Issue.
                                </p>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-apple-gray-400 uppercase tracking-wider mb-1.5">Track Title</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-apple-gray-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-all" placeholder="e.g. Midnight Walk" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-apple-gray-400 uppercase tracking-wider mb-1.5">Artist</label>
                                        <input required type="text" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} className="w-full bg-apple-gray-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-all" placeholder="Your Name" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-apple-gray-400 uppercase tracking-wider mb-1.5">Genre</label>
                                        <input required type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-apple-gray-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-all" placeholder="Lofi, Synth..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-apple-gray-400 uppercase tracking-wider mb-1.5">Audio Link (.mp3 or stream URL)</label>
                                    <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-apple-gray-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-all" placeholder="https://..." />
                                </div>
                                
                                <div className="mt-6 flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-apple-gray-300 hover:bg-white/5 transition-all font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-all flex justify-center items-center gap-2">
                                        <Github className="w-4 h-4" /> Send Review
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tracks Table */}
                <div className="bg-apple-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-apple-gray-950/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-apple-gray-400 uppercase tracking-wider font-mono">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-apple-gray-400 uppercase tracking-wider font-mono">Title / Artist</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-apple-gray-400 uppercase tracking-wider font-mono hidden md:table-cell">Genre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-apple-gray-400 uppercase tracking-wider font-mono text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tracks.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-apple-gray-400">
                                            <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            No verified tracks found yet. Be the first to submit!
                                        </td>
                                    </tr>
                                ) : (
                                    tracks.map((track) => (
                                        <tr key={track.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => togglePlay(track)}
                                                    className={`w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full transition-all ${
                                                        playing === track.id
                                                            ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20'
                                                            : 'bg-white/5 text-apple-gray-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    {playing === track.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-base mb-1 ${playing === track.id ? 'text-apple-blue' : 'text-white'}`}>
                                                        {track.title}
                                                    </span>
                                                    <span className="text-sm text-apple-gray-400 flex items-center gap-2">
                                                        {track.artist}
                                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                        {track.duration}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-apple-gray-300">
                                                    {track.genre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a 
                                                    href={track.url} 
                                                    download 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-apple-gray-300 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Download Track"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Review Instructions Widget block */}
                <div className="mt-12 p-6 rounded-2xl border border-white/10 bg-gradient-to-tr from-apple-gray-900 to-apple-gray-950 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-xl relative overflow-hidden group">
                     {/* decorative bg */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-apple-blue/10 blur-3xl -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-purple-500/10"></div>
                     
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-apple-blue" />
                     </div>
                     <div>
                         <h4 className="font-semibold text-white mb-1">How Submissions Work</h4>
                         <p className="text-sm text-apple-gray-400 leading-relaxed max-w-3xl mb-3">
                             Because TimiGS operates securely without backend servers, track submissions rely on community Github Pull Requests. 
                             Once you submit a track using the form, we'll compose a GitHub Issue describing your track. 
                             Maintainers periodically review these issues and merge approved JSON data into the catalog!
                         </p>
                         <a href="https://github.com/BANSAFAn/timiGS-/blob/main/site/public/music.json" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-apple-blue hover:text-white transition-colors flex items-center gap-1">
                             View the raw catalog <ExternalLink className="w-3 h-3"/>
                         </a>
                     </div>
                </div>
                
            </div>
        </div>
    );
};

export default MusicApp;
