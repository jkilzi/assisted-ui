import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableVariant,
  IRow,
  expandable,
} from '@patternfly/react-table';
import { ConnectedIcon } from '@patternfly/react-icons';
import Humanize from 'humanize-plus';
import { EmptyState, ErrorState } from '../ui/uiState';
import { getColSpanRow } from '../ui/table/utils';
import { ResourceUIState } from '../../types';
import { Host, Introspection, BlockDevice } from '../../api/types';
import { DiscoveryImageModalButton } from './discoveryImageModal';
import HostStatus from './HostStatus';

type Props = {
  hosts?: Host[];
  uiState: ResourceUIState;
  fetchHosts: () => void;
  variant?: TableVariant;
};

type HostRowHwInfo = {
  cpu: string;
  memory: string;
  disk: string;
};

const getHostRowHardwareInfo = (hwInfoString: string): HostRowHwInfo => {
  let hwInfo: Introspection = {};
  try {
    hwInfo = JSON.parse(hwInfoString);
  } catch (e) {
    console.error('Failed to parse Hardware Info', e);
  }
  return {
    cpu: `${hwInfo?.cpu?.cpus}x ${Humanize.formatNumber(hwInfo?.cpu?.['cpu-mhz'] || 0)} MHz`,
    memory: Humanize.fileSize(hwInfo?.memory?.[0]?.total || 0),
    disk: Humanize.fileSize(
      hwInfo?.['block-devices']
        ?.filter((device: BlockDevice) => device['device-type'] === 'disk')
        .reduce((diskSize: number, device: BlockDevice) => diskSize + (device?.size || 0), 0) || 0,
    ),
  };
};

const hostToHostTableRow = (host: Host): IRow => {
  // console.log('--- host: ', host);
  const { id, status, statusInfo, hardwareInfo = '' } = host;
  const { cpu, memory, disk } = getHostRowHardwareInfo(hardwareInfo);
  return {
    isOpen: false,
    cells: [
      id, // TODO: should be "name"
      'Master', // TODO: should be flexible (a dropdown for master/worker)
      id, // TODO: should be serial number
      { title: <HostStatus status={status} statusInfo={statusInfo} /> },
      cpu,
      memory,
      disk,
    ],
  };
};

const HostsTableEmptyState: React.FC = () => (
  <EmptyState
    icon={ConnectedIcon}
    title="Waiting for hosts..."
    content="Boot the discovery ISO on a hardware that should become part of this bare metal cluster. After booting the ISO the hosts get inspected and register to the cluster. At least 3 bare metal hosts are required to form the cluster."
    primaryAction={<DiscoveryImageModalButton />}
  />
);

const columns = [
  { title: 'ID', cellFormatters: [expandable] },
  { title: 'Role' },
  { title: 'Serial Number' },
  { title: 'Status' },
  { title: 'vCPU' },
  { title: 'Memory' },
  { title: 'Disk' },
];

const rowKey = (params: any) => params.rowData.id.title;

const HostsTable: React.FC<Props> = ({ hosts = [], uiState, fetchHosts, variant }) => {
  const [hostRows, setHostRows] = React.useState([] as IRow[]);
  React.useEffect(() => {
    setHostRows(hosts.map(hostToHostTableRow));
  }, [hosts]);

  const rows = React.useMemo(() => {
    const errorState = <ErrorState title="Failed to fetch hosts" fetchData={fetchHosts} />;
    const columnCount = columns.length;
    switch (uiState) {
      // case ResourceUIState.LOADING:
      //   return getColSpanRow(loadingState, columnCount);
      case ResourceUIState.ERROR:
        return getColSpanRow(errorState, columnCount);
      // case ResourceUIState.EMPTY:
      //   return getColSpanRow(emptyState, columnCount);
      default:
        if (hostRows.length) {
          return hostRows;
        }
        return getColSpanRow(HostsTableEmptyState, columnCount);
    }
  }, [uiState, fetchHosts, hostRows]);

  const onCollapse = React.useCallback(
    (_event, rowKey) => {
      const newHostRows = [...hostRows];
      newHostRows[rowKey].isOpen = !newHostRows[rowKey].isOpen;
      setHostRows(newHostRows);
    },
    [hostRows],
  );

  return (
    <Table
      rows={rows}
      cells={columns}
      onCollapse={onCollapse}
      variant={variant ? variant : rows.length > 10 ? TableVariant.compact : undefined}
      aria-label="Hosts table"
    >
      <TableHeader />
      <TableBody rowKey={rowKey} />
    </Table>
  );
};

export default HostsTable;
