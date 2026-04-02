drop policy if exists admin_delete_service_requests on speu.service_requests;
create policy admin_delete_service_requests on speu.service_requests
for delete to authenticated
using (speu.is_admin(auth.uid()));
