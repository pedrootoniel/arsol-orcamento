export const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'unknown';
  }
};

export const createAuditLog = async (
  supabaseClient: any,
  action: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown> | null = null,
  newValues: Record<string, unknown> | null = null
) => {
  try {
    const ipAddress = await getUserIP();
    const userAgent = navigator.userAgent;

    const { data: { user } } = await supabaseClient.auth.getUser();

    await supabaseClient.from('audit_logs').insert({
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

export const generateBudgetPDF = (budget: any, items: any[]): string => {
  return '';
};
