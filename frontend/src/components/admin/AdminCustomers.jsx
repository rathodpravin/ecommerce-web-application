import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';
import Pagination from '../Pagination';
import Loading from '../Loading';
import StateMessage from '../StateMessage';

export default function AdminCustomers() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminService.customers(page, 10).then(setData).catch((e) => setError(getErrorMessage(e, 'Could not load customers.'))).finally(() => setLoading(false));
  }, [page]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel">
      <div className="panel-head"><h2>Registered customers</h2></div>
      {loading && <Loading label="Loading customers…" />}
      {!loading && error && <StateMessage type="error" title="Couldn't load customers" message={error}><button type="button" className="btn btn-primary" onClick={load}>Try again</button></StateMessage>}
      {!loading && !error && data?.content.length === 0 && <StateMessage title="No customers yet" message="Customers appear here after they register." />}
      {!loading && !error && data?.content.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
              <tbody>{data.content.map((u) => <tr key={u.id}><td>{u.fullName}</td><td>{u.email}</td><td>{formatDate(u.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
