import { useState, useEffect } from 'react';
import { getPortfolio, addStock, deleteStock } from '../api/portfolioService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ stockSymbol: '', quantity: '', buyPrice: '' });
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Portfolio data fetch karo jab page load ho
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await getPortfolio();
      setPortfolio(res.data);
    } catch (err) {
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Naya stock add karne ka form submit
  const handleAddStock = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await addStock({
        stockSymbol: formData.stockSymbol.trim().toUpperCase(),
        quantity: Number(formData.quantity),
        buyPrice: Number(formData.buyPrice),
      });
      setFormData({ stockSymbol: '', quantity: '', buyPrice: '' });
      fetchPortfolio(); // list refresh karo
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    }
  };

  // Stock delete karo
  const handleDelete = async (id) => {
    try {
      await deleteStock(id);
      fetchPortfolio(); // list refresh karo
    } catch (err) {
      setError('Failed to delete stock');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Total portfolio summary calculate karo
  const totalInvestment = portfolio.reduce((sum, item) => sum + item.investment, 0);
  const totalCurrentValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
  const totalProfitLoss = totalCurrentValue - totalInvestment;

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user?.name} 👋</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Logout</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <p>Total Investment</p>
          <h3>₹{totalInvestment.toFixed(2)}</h3>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <p>Current Value</p>
          <h3>₹{totalCurrentValue.toFixed(2)}</h3>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <p>Total P/L</p>
          <h3 style={{ color: totalProfitLoss >= 0 ? 'green' : 'red' }}>
            ₹{totalProfitLoss.toFixed(2)}
          </h3>
        </div>
      </div>

      {/* Add Stock Form */}
      <h3>Add Stock</h3>
      <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Symbol (e.g. AAPL)"
          value={formData.stockSymbol}
          onChange={(e) => setFormData({ ...formData, stockSymbol: e.target.value })}
          required
          style={{ padding: '8px', flex: 1 }}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          required
          min="1"
          style={{ padding: '8px', flex: 1 }}
        />
        <input
          type="number"
          placeholder="Buy Price"
          value={formData.buyPrice}
          onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
          required
          min="0"
          step="0.01"
          style={{ padding: '8px', flex: 1 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Add</button>
      </form>

      {/* Portfolio Table */}
      <h3>My Portfolio</h3>
      {loading ? (
        <p>Loading...</p>
      ) : portfolio.length === 0 ? (
        <p>No stocks yet. Add one above!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Symbol</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Qty</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Buy Price</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Current Price</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>P/L</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Return %</th>
              <th style={{ textAlign: 'left', padding: '8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{item.stockSymbol}</td>
                <td style={{ padding: '8px' }}>{item.quantity}</td>
                <td style={{ padding: '8px' }}>₹{item.buyPrice}</td>
                <td style={{ padding: '8px' }}>₹{item.currentPrice}</td>
                <td style={{ padding: '8px', color: item.profitLoss >= 0 ? 'green' : 'red' }}>
                  ₹{item.profitLoss.toFixed(2)}
                </td>
                <td style={{ padding: '8px', color: item.profitLoss >= 0 ? 'green' : 'red' }}>
                  {item.percentageReturn}%
                </td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => handleDelete(item._id)} style={{ padding: '4px 8px' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;