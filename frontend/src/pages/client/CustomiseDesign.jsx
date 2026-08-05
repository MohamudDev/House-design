import { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Ruler, Send, AlertTriangle } from 'lucide-react';
import ClientNavbar from '../../components/client/ClientNavbar';
import { AuthContext } from '../../context/AuthContext';

const calcArea = (length, width) => {
  const l = Number(length);
  const w = Number(width);
  if (!l || !w || l <= 0 || w <= 0) return 0;
  return Math.round(l * w * 100) / 100;
};

const CustomiseDesign = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [counts, setCounts] = useState({
    rooms: 1,
    bathrooms: 1,
    kitchens: 1,
    livingRooms: 1,
    masterRooms: 0
  });
  const [house, setHouse] = useState({ length: '', width: '' });
  const [note, setNote] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(`/api/client/designs/${designId}`, config);
        const d = data.data;
        setDesign(d);
        setCounts({
          rooms: d.rooms || 1,
          bathrooms: d.bathrooms || 1,
          kitchens: d.kitchens || 1,
          livingRooms: d.livingRooms || 1,
          masterRooms: d.masterRooms || 0
        });
        setHouse({
          length: d.houseLength || '',
          width: d.houseWidth || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load design');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [designId]);

  const houseArea = useMemo(() => calcArea(house.length, house.width), [house.length, house.width]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!house.length || !house.width || houseArea <= 0) {
      setError('Please enter house length and width.');
      return;
    }
    if (Number(counts.rooms) < 1 && Number(counts.bathrooms) < 1) {
      setError('Please set at least bedrooms or bathrooms.');
      return;
    }

    try {
      setSubmitting(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(
        '/api/customizations',
        {
          designId,
          note,
          proposed: {
            rooms: Number(counts.rooms) || 0,
            bathrooms: Number(counts.bathrooms) || 0,
            kitchens: Number(counts.kitchens) || 0,
            livingRooms: Number(counts.livingRooms) || 0,
            masterRooms: Number(counts.masterRooms) || 0,
            houseLength: Number(house.length),
            houseWidth: Number(house.width),
            houseArea,
            roomsDetail: []
          }
        },
        config
      );
      setSuccess('Customisation sent to the engineer.');
      setTimeout(() => navigate('/client-dashboard/customisations'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send customisation');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ClientNavbar variant="workspace" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div className="text-slate-500 animate-pulse">Loading design...</div>
        ) : !design ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl">{error || 'Design not found'}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 p-6">
                {design.images?.[0] && (
                  <img
                    src={design.images[0]}
                    alt={design.title}
                    className="w-full sm:w-40 h-32 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
                  />
                )}
                <div>
                  <p className="text-xs font-bold uppercase text-indigo-500 mb-1">Customise Design</p>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">{design.title}</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Original size:{' '}
                    {design.houseLength && design.houseWidth
                      ? `${design.houseLength} × ${design.houseWidth} m${design.houseArea ? ` (${design.houseArea} m²)` : ''}`
                      : 'Not specified'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Your changes create a request only — the engineer&apos;s original design is not modified.
                  </p>
                  {!design.houseLength || !design.houseWidth ? (
                    <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                      Design-kan hore cabir ma lahan. Weli waad customise-gareyn kartaa — geli Length iyo Width hoos.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {(error || success) && (
              <div
                className={`p-4 rounded-2xl text-sm font-medium flex items-start gap-2 ${
                  error
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                }`}
              >
                {error && <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                {error || success}
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ruler size={18} className="text-indigo-600" /> Proposed house size
              </h2>
              <p className="text-xs text-slate-500">
                {!design.houseLength || !design.houseWidth
                  ? 'Geli cabirka guriga aad rabto (mitir).'
                  : 'Waxaad beddeli kartaa cabirka asalka ah haddii aad rabto.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Length (m)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={house.length}
                    onChange={(e) => setHouse({ ...house, length: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Width (m)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={house.width}
                    onChange={(e) => setHouse({ ...house, width: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Area (m²)</label>
                  <input
                    type="text"
                    readOnly
                    value={houseArea || '—'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Room counts</h2>
              <p className="text-xs text-slate-500">Beddel tirada qolalka iyo suuliga.</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  ['rooms', 'Bedrooms'],
                  ['bathrooms', 'Bathrooms'],
                  ['kitchens', 'Kitchens'],
                  ['livingRooms', 'Living'],
                  ['masterRooms', 'Master']
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      value={counts[key]}
                      onChange={(e) => setCounts({ ...counts, [key]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">Note to engineer (optional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what you want changed..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                to="/client-dashboard/customisations"
                className="px-5 py-3 text-center text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                My Customisations
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? 'Sending...' : 'Send to Engineer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomiseDesign;
