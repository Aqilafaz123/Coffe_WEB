<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancialReportExportService
{
    private const COLOR_NAVY = '081B56';
    private const COLOR_NAVY_LIGHT = '0F276E';
    private const COLOR_GOLD = 'C99826';
    private const COLOR_BG_HEADER = '081B56';
    private const COLOR_BG_SECTION = 'EDF2F7';
    private const COLOR_BG_ROW_LIGHT = 'F8FAFC';
    private const COLOR_BG_ROW_ALT = 'FFFFFF';
    private const COLOR_BG_TOTAL = 'E2E8F0';
    private const COLOR_BORDER_GRAY = 'CBD5E1';
    private const COLOR_PROFIT = '15803D';
    private const COLOR_LOSS = 'B91C1C';
    private const COLOR_AMBER = 'B45309';
    private const COLOR_CYAN = '0369A1';

    public function generateExcel(array $pnlData, ?string $exportedBy = 'Super Admin'): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        $spreadsheet->getProperties()
            ->setCreator('RAHARDJA Coffee Shop')
            ->setLastModifiedBy($exportedBy ?: 'Super Admin')
            ->setTitle('Laporan Keuangan Laba Rugi (P&L)')
            ->setSubject('Laporan Keuangan Bulanan PnL')
            ->setDescription('Laporan Keuangan dan Profit and Loss Rahardja Coffee Shop')
            ->setCategory('Financial Report');

        // 1. Sheet 1: Laporan Laba Rugi (P&L)
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Laporan Laba Rugi');
        $this->buildPnLSummarySheet($sheet1, $pnlData, $exportedBy);

        // 2. Sheet 2: Rekapitulasi Penjualan Harian
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Rekap Penjualan Harian');
        $this->buildDailySalesSheet($sheet2, $pnlData, $exportedBy);

        // 3. Sheet 3: Detail Menu & Pembayaran
        $sheet3 = $spreadsheet->createSheet();
        $sheet3->setTitle('Detail Menu & Pembayaran');
        $this->buildDailyMenuSalesSheet($sheet3, $pnlData, $exportedBy);

        // 4. Sheet 4: Profitabilitas Menu Produk
        $sheet4 = $spreadsheet->createSheet();
        $sheet4->setTitle('Profitabilitas Menu');
        $this->buildProductProfitabilitySheet($sheet4, $pnlData);

        // 5. Sheet 5: Rincian Beban Operasional
        $sheet5 = $spreadsheet->createSheet();
        $sheet5->setTitle('Beban Operasional');
        $this->buildExpensesSheet($sheet5, $pnlData);

        // 6. Sheet 6: Rincian Transaksi Penjualan
        $sheet6 = $spreadsheet->createSheet();
        $sheet6->setTitle('Rincian Pesanan');
        $this->buildOrdersSheet($sheet6, $pnlData);

        // Set active sheet back to Sheet 1
        $spreadsheet->setActiveSheetIndex(0);

        // Prepare filename
        $safePeriodLabel = preg_replace('/[^A-Za-z0-9\-]/', '_', $pnlData['period_label'] ?? 'Bulanan');
        $filename = 'Laporan_Keuangan_PnL_' . $safePeriodLabel . '_' . date('Ymd_His') . '.xlsx';

        return new StreamedResponse(
            function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0, must-revalidate',
                'Pragma' => 'public',
            ]
        );
    }

    private function buildPnLSummarySheet(Worksheet $sheet, array $data, ?string $exportedBy): void
    {
        $sheet->setShowGridLines(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);

        // Explicit, generous column widths
        $sheet->getColumnDimension('A')->setWidth(8);   // No / Kode
        $sheet->getColumnDimension('B')->setWidth(56);  // Pos Akun & Deskripsi (Wide!)
        $sheet->getColumnDimension('C')->setWidth(24);  // Rincian Komponen (Rp)
        $sheet->getColumnDimension('D')->setWidth(26);  // Jumlah Total (Rp)
        $sheet->getColumnDimension('E')->setWidth(18);  // Rasio / % Omzet

        $summary = $data['summary'] ?? [];
        $netRevenue = (float) ($summary['net_revenue'] ?? 0);
        $isProfit = ($summary['net_profit'] ?? 0) >= 0;

        // Header Title
        $sheet->getRowDimension(1)->setRowHeight(26);
        $sheet->mergeCells('A1:E1');
        $sheet->setCellValue('A1', 'RAHARDJA - ES KRIM, TEH & KOPI');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getRowDimension(2)->setRowHeight(22);
        $sheet->mergeCells('A2:E2');
        $sheet->setCellValue('A2', 'LAPORAN LABA RUGI (PROFIT AND LOSS STATEMENT)');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(13);
        $sheet->getStyle('A2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getRowDimension(3)->setRowHeight(18);
        $sheet->mergeCells('A3:E3');
        $sheet->setCellValue('A3', 'Periode: ' . ($data['period_label'] ?? '-') . '   |   Tanggal Ekspor: ' . now()->translatedFormat('d F Y H:i') . ' WIB   |   Oleh: ' . ($exportedBy ?: 'Admin'));
        $sheet->getStyle('A3')->getFont()->setSize(9.5)->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));
        $sheet->getStyle('A3')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // -------------------------------------------------------------
        // EXECUTIVE KPI SUMMARY (Rows 5 - 11)
        // -------------------------------------------------------------
        $sheet->getRowDimension(5)->setRowHeight(24);
        $sheet->mergeCells('A5:E5');
        $sheet->setCellValue('A5', 'RINGKASAN EKSEKUTIF FINANSIAL (KEY PERFORMANCE INDICATORS)');
        $sheet->getStyle('A5')->getFont()->setBold(true)->setSize(11)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('E2E8F0');
        $sheet->getStyle('A5')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);

        // Row 6-7: Row 1 of KPI Cards
        $sheet->getRowDimension(6)->setRowHeight(18);
        $sheet->getRowDimension(7)->setRowHeight(26);

        // Card 1: Pendapatan Bersih
        $sheet->mergeCells('A6:B6');
        $sheet->setCellValue('A6', 'PENDAPATAN BERSIH (NET REVENUE)');
        $sheet->getStyle('A6')->getFont()->setSize(9)->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('475569'));
        $sheet->getStyle('A6')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $sheet->getStyle('A6:B6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);

        $sheet->mergeCells('A7:B7');
        $sheet->setCellValue('A7', $summary['net_revenue'] ?? 0);
        $sheet->getStyle('A7')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A7')->getNumberFormat()->setFormatCode('"Rp "#,##0');
        $sheet->getStyle('A7')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $sheet->getStyle('A7:B7')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);
        $this->applyBoxBorder($sheet, 'A6:B7');

        // Card 2: Total HPP Bahan Baku
        $sheet->setCellValue('C6', 'HPP BAHAN BAKU (COGS)');
        $sheet->getStyle('C6')->getFont()->setSize(9)->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('475569'));
        $sheet->getStyle('C6')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('C6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);

        $sheet->setCellValue('C7', $summary['total_cogs'] ?? 0);
        $sheet->getStyle('C7')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_AMBER));
        $sheet->getStyle('C7')->getNumberFormat()->setFormatCode('"Rp "#,##0');
        $sheet->getStyle('C7')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('C7')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);
        $this->applyBoxBorder($sheet, 'C6:C7');

        // Card 3: Laba Kotor
        $sheet->mergeCells('D6:E6');
        $sheet->setCellValue('D6', 'LABA KOTOR (GROSS PROFIT)');
        $sheet->getStyle('D6')->getFont()->setSize(9)->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('475569'));
        $sheet->getStyle('D6')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('D6:E6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);

        $sheet->mergeCells('D7:E7');
        $sheet->setCellValue('D7', $summary['gross_profit'] ?? 0);
        $sheet->getStyle('D7')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_CYAN));
        $sheet->getStyle('D7')->getNumberFormat()->setFormatCode('"Rp "#,##0');
        $sheet->getStyle('D7')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('D7:E7')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);
        $this->applyBoxBorder($sheet, 'D6:E7');

        // Row 8-9: Row 2 of KPI Cards
        $sheet->getRowDimension(8)->setRowHeight(18);
        $sheet->getRowDimension(9)->setRowHeight(26);

        // Card 4: Total Beban Operasional
        $sheet->mergeCells('A8:B8');
        $sheet->setCellValue('A8', 'TOTAL BEBAN OPERASIONAL (OPEX)');
        $sheet->getStyle('A8')->getFont()->setSize(9)->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('475569'));
        $sheet->getStyle('A8')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $sheet->getStyle('A8:B8')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);

        $sheet->mergeCells('A9:B9');
        $sheet->setCellValue('A9', $summary['total_expenses'] ?? 0);
        $sheet->getStyle('A9')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_LOSS));
        $sheet->getStyle('A9')->getNumberFormat()->setFormatCode('"Rp "#,##0');
        $sheet->getStyle('A9')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $sheet->getStyle('A9:B9')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);
        $this->applyBoxBorder($sheet, 'A8:B9');

        // Card 5: Gross Margin %
        $sheet->setCellValue('C8', 'GROSS MARGIN %');
        $sheet->getStyle('C8')->getFont()->setSize(9)->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('475569'));
        $sheet->getStyle('C8')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('C8')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);

        $sheet->setCellValue('C9', ($summary['gross_profit_margin'] ?? 0) / 100);
        $sheet->getStyle('C9')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_CYAN));
        $sheet->getStyle('C9')->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle('C9')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('C9')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);
        $this->applyBoxBorder($sheet, 'C8:C9');

        // Card 6: Net Margin %
        $sheet->mergeCells('D8:E8');
        $sheet->setCellValue('D8', 'NET PROFIT MARGIN %');
        $sheet->getStyle('D8')->getFont()->setSize(9)->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('475569'));
        $sheet->getStyle('D8')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('D8:E8')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);

        $sheet->mergeCells('D9:E9');
        $sheet->setCellValue('D9', ($summary['net_profit_margin'] ?? 0) / 100);
        $sheet->getStyle('D9')->getFont()->setBold(true)->setSize(14)->setColor(
            new \PhpOffice\PhpSpreadsheet\Style\Color($isProfit ? self::COLOR_PROFIT : self::COLOR_LOSS)
        );
        $sheet->getStyle('D9')->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle('D9')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('D9:E9')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_ROW_LIGHT);
        $this->applyBoxBorder($sheet, 'D8:E9');

        // Row 10-11: Hero Card for Net Income
        $sheet->getRowDimension(10)->setRowHeight(18);
        $sheet->getRowDimension(11)->setRowHeight(28);

        $sheet->mergeCells('A10:E10');
        $statusText = $isProfit ? 'SURPLUS / UNTUNG' : 'DEFISIT / RUGI';
        $sheet->setCellValue('A10', "HASIL AKHIR: LABA / (RUGI) BERSIH PERIODE INI  [STATUS: {$statusText}]");
        $sheet->getStyle('A10')->getFont()->setBold(true)->setSize(9.5)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle('A10')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_NAVY_LIGHT);
        $sheet->getStyle('A10')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);

        $sheet->mergeCells('A11:E11');
        $sheet->setCellValue('A11', $summary['net_profit'] ?? 0);
        $sheet->getStyle('A11')->getFont()->setBold(true)->setSize(16)->setColor(
            new \PhpOffice\PhpSpreadsheet\Style\Color($isProfit ? self::COLOR_PROFIT : self::COLOR_LOSS)
        );
        $sheet->getStyle('A11')->getNumberFormat()->setFormatCode('"Rp "#,##0;[Red]-"Rp "#,##0;"Rp "0');
        $sheet->getStyle('A11')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($isProfit ? 'DCFCE7' : 'FEE2E2');
        $sheet->getStyle('A11')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $this->applyBoxBorder($sheet, 'A10:E11');

        // -------------------------------------------------------------
        // DETAILED ACCOUNTING STATEMENT (Row 13 onwards)
        // -------------------------------------------------------------
        $row = 13;
        $sheet->getRowDimension($row)->setRowHeight(26);
        $sheet->setCellValue("A{$row}", 'No.');
        $sheet->setCellValue("B{$row}", 'Pos Akun Finansial & Keterangan');
        $sheet->setCellValue("C{$row}", 'Rincian (Rp)');
        $sheet->setCellValue("D{$row}", 'Jumlah Total (Rp)');
        $sheet->setCellValue("E{$row}", '% Terhadap Omzet');

        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_HEADER);
        $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("C{$row}:D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->applyRowBorder($sheet, "A{$row}:E{$row}");
        $row++;

        // I. PENDAPATAN USAHA (REVENUE)
        $sheet->getRowDimension($row)->setRowHeight(24);
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'I. PENDAPATAN USAHA (REVENUE)');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(10.5)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY_LIGHT));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_SECTION);
        $sheet->getStyle("A{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $this->applyRowBorder($sheet, "A{$row}:E{$row}");
        $row++;

        // 1.1 Penjualan Produk F&B Kotor
        $sheet->getRowDimension($row)->setRowHeight(22);
        $sheet->setCellValue("A{$row}", '1.1');
        $sheet->setCellValue("B{$row}", 'Penjualan Produk F&B Kotor (Gross Sales)');
        $sheet->setCellValue("C{$row}", $summary['gross_sales'] ?? 0);
        $sheet->setCellValue("D{$row}", '');
        $grossPct = $netRevenue > 0 ? (($summary['gross_sales'] ?? 0) / $netRevenue) : 1;
        $sheet->setCellValue("E{$row}", $grossPct);
        $this->formatAccountingDataRow($sheet, $row);
        $row++;

        // 1.2 Pendapatan Reservasi Ruangan (if any)
        if (($summary['reservations_revenue'] ?? 0) > 0) {
            $sheet->getRowDimension($row)->setRowHeight(22);
            $sheet->setCellValue("A{$row}", '1.2');
            $sheet->setCellValue("B{$row}", 'Pendapatan Sewa Ruangan (Room Reservations)');
            $sheet->setCellValue("C{$row}", $summary['reservations_revenue'] ?? 0);
            $sheet->setCellValue("D{$row}", '');
            $rsvPct = $netRevenue > 0 ? (($summary['reservations_revenue'] ?? 0) / $netRevenue) : 0;
            $sheet->setCellValue("E{$row}", $rsvPct);
            $this->formatAccountingDataRow($sheet, $row);
            $row++;
        }

        // 1.3 Potongan Penjualan / Diskon (if any)
        if (($summary['total_discounts'] ?? 0) > 0) {
            $sheet->getRowDimension($row)->setRowHeight(22);
            $sheet->setCellValue("A{$row}", '1.3');
            $sheet->setCellValue("B{$row}", 'Potongan Penjualan / Voucher Diskon');
            $sheet->setCellValue("C{$row}", -1 * ($summary['total_discounts'] ?? 0));
            $sheet->setCellValue("D{$row}", '');
            $discPct = $netRevenue > 0 ? ((-1 * ($summary['total_discounts'] ?? 0)) / $netRevenue) : 0;
            $sheet->setCellValue("E{$row}", $discPct);
            $this->formatAccountingDataRow($sheet, $row);
            $sheet->getStyle("C{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_LOSS));
            $row++;
        }

        // TOTAL PENDAPATAN BERSIH
        $sheet->getRowDimension($row)->setRowHeight(24);
        $sheet->setCellValue("A{$row}", '');
        $sheet->setCellValue("B{$row}", 'TOTAL PENDAPATAN BERSIH (NET REVENUE)');
        $sheet->setCellValue("C{$row}", '');
        $sheet->setCellValue("D{$row}", $summary['net_revenue'] ?? 0);
        $sheet->setCellValue("E{$row}", 1.0);
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
        $this->formatAccountingTotalRow($sheet, $row);
        $row += 2;

        // II. HARGA POKOK PENJUALAN (HPP / COGS)
        $sheet->getRowDimension($row)->setRowHeight(24);
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'II. HARGA POKOK PENJUALAN (COST OF GOODS SOLD - COGS)');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(10.5)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY_LIGHT));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_SECTION);
        $sheet->getStyle("A{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $this->applyRowBorder($sheet, "A{$row}:E{$row}");
        $row++;

        // 2.1 Pemakaian Bahan Baku
        $sheet->getRowDimension($row)->setRowHeight(22);
        $sheet->setCellValue("A{$row}", '2.1');
        $sheet->setCellValue("B{$row}", 'Biaya Pemakaian Bahan Baku & Kemasan Produk Terjual');
        $sheet->setCellValue("C{$row}", $summary['total_cogs'] ?? 0);
        $sheet->setCellValue("D{$row}", '');
        $cogsPct = $netRevenue > 0 ? (($summary['total_cogs'] ?? 0) / $netRevenue) : 0;
        $sheet->setCellValue("E{$row}", $cogsPct);
        $this->formatAccountingDataRow($sheet, $row);
        $row++;

        // TOTAL HPP
        $sheet->getRowDimension($row)->setRowHeight(24);
        $sheet->setCellValue("A{$row}", '');
        $sheet->setCellValue("B{$row}", 'TOTAL HARGA POKOK PENJUALAN (HPP)');
        $sheet->setCellValue("C{$row}", '');
        $sheet->setCellValue("D{$row}", $summary['total_cogs'] ?? 0);
        $sheet->setCellValue("E{$row}", $cogsPct);
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
        $sheet->getStyle("D{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_AMBER));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
        $this->formatAccountingTotalRow($sheet, $row);
        $row += 2;

        // III. LABA KOTOR (GROSS PROFIT)
        $sheet->getRowDimension($row)->setRowHeight(26);
        $sheet->setCellValue("A{$row}", '');
        $sheet->setCellValue("B{$row}", 'III. LABA KOTOR (GROSS PROFIT)');
        $sheet->setCellValue("C{$row}", '');
        $sheet->setCellValue("D{$row}", $summary['gross_profit'] ?? 0);
        $grossMarginPct = ($summary['gross_profit_margin'] ?? 0) / 100;
        $sheet->setCellValue("E{$row}", $grossMarginPct);
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true)->setSize(11)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_CYAN));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('E0F2FE');
        $this->formatAccountingTotalRow($sheet, $row);
        $row += 2;

        // IV. BEBAN OPERASIONAL (OPERATING EXPENSES)
        $sheet->getRowDimension($row)->setRowHeight(24);
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'IV. BEBAN OPERASIONAL (OPERATING EXPENSES)');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(10.5)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY_LIGHT));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_SECTION);
        $sheet->getStyle("A{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setIndent(1);
        $this->applyRowBorder($sheet, "A{$row}:E{$row}");
        $row++;

        $expCategories = $data['expenses_by_category'] ?? [];
        if (!empty($expCategories)) {
            $catNum = 1;
            foreach ($expCategories as $cat) {
                $sheet->getRowDimension($row)->setRowHeight(22);
                $sheet->setCellValue("A{$row}", "4.{$catNum}");
                $sheet->setCellValue("B{$row}", $cat['label'] . ' (Porsi Beban: ' . $cat['percentage'] . '%)');
                $sheet->setCellValue("C{$row}", $cat['amount'] ?? 0);
                $sheet->setCellValue("D{$row}", '');
                $catRevPct = $netRevenue > 0 ? (($cat['amount'] ?? 0) / $netRevenue) : 0;
                $sheet->setCellValue("E{$row}", $catRevPct);
                $this->formatAccountingDataRow($sheet, $row);
                $row++;
                $catNum++;
            }
        } else {
            $sheet->getRowDimension($row)->setRowHeight(22);
            $sheet->setCellValue("A{$row}", '-');
            $sheet->setCellValue("B{$row}", 'Tidak ada beban operasional tercatat pada periode ini');
            $sheet->setCellValue("C{$row}", 0);
            $sheet->setCellValue("D{$row}", '');
            $sheet->setCellValue("E{$row}", 0);
            $this->formatAccountingDataRow($sheet, $row);
            $row++;
        }

        // TOTAL BEBAN OPERASIONAL
        $sheet->getRowDimension($row)->setRowHeight(24);
        $sheet->setCellValue("A{$row}", '');
        $sheet->setCellValue("B{$row}", 'TOTAL BEBAN OPERASIONAL (OPEX)');
        $sheet->setCellValue("C{$row}", '');
        $sheet->setCellValue("D{$row}", $summary['total_expenses'] ?? 0);
        $totalExpPct = $netRevenue > 0 ? (($summary['total_expenses'] ?? 0) / $netRevenue) : 0;
        $sheet->setCellValue("E{$row}", $totalExpPct);
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
        $sheet->getStyle("D{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_LOSS));
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
        $this->formatAccountingTotalRow($sheet, $row);
        $row += 2;

        // V. LABA / (RUGI) BERSIH (NET INCOME)
        $sheet->getRowDimension($row)->setRowHeight(28);
        $sheet->setCellValue("A{$row}", '');
        $sheet->setCellValue("B{$row}", "V. LABA / (RUGI) BERSIH (NET INCOME)  [{$statusText}]");
        $sheet->setCellValue("C{$row}", '');
        $sheet->setCellValue("D{$row}", $summary['net_profit'] ?? 0);
        $netMarginPct = ($summary['net_profit_margin'] ?? 0) / 100;
        $sheet->setCellValue("E{$row}", $netMarginPct);

        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true)->setSize(12)->setColor(
            new \PhpOffice\PhpSpreadsheet\Style\Color($isProfit ? self::COLOR_PROFIT : self::COLOR_LOSS)
        );
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(
            $isProfit ? 'DCFCE7' : 'FEE2E2'
        );

        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0;[Red]-"Rp "#,##0;"Rp "0');
        $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Double underline border for net income
        $sheet->getStyle("A{$row}:E{$row}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle("A{$row}:E{$row}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE)->getColor()->setARGB($isProfit ? self::COLOR_PROFIT : self::COLOR_LOSS);
        $sheet->getStyle("A{$row}")->getBorders()->getLeft()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle("E{$row}")->getBorders()->getRight()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
    }

    private function buildProductProfitabilitySheet(Worksheet $sheet, array $data): void
    {
        $sheet->setShowGridLines(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);

        // Explicit generous widths
        $sheet->getColumnDimension('A')->setWidth(7);   // No
        $sheet->getColumnDimension('B')->setWidth(34);  // Nama Produk
        $sheet->getColumnDimension('C')->setWidth(20);  // Kategori
        $sheet->getColumnDimension('D')->setWidth(14);  // Qty Terjual
        $sheet->getColumnDimension('E')->setWidth(18);  // Harga Jual (Rp)
        $sheet->getColumnDimension('F')->setWidth(18);  // HPP Satuan (Rp)
        $sheet->getColumnDimension('G')->setWidth(22);  // Total Omzet (Rp)
        $sheet->getColumnDimension('H')->setWidth(20);  // Total HPP (Rp)
        $sheet->getColumnDimension('I')->setWidth(20);  // Laba Kotor (Rp)
        $sheet->getColumnDimension('J')->setWidth(16);  // Gross Margin %

        $products = $data['product_margins'] ?? [];

        // Title
        $sheet->getRowDimension(1)->setRowHeight(26);
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', 'ANALISIS MARGIN & PROFITABILITAS MENU PRODUK');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getRowDimension(2)->setRowHeight(18);
        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Periode: ' . ($data['period_label'] ?? '-') . '   |   Diperbarui: ' . now()->translatedFormat('d F Y H:i') . ' WIB');
        $sheet->getStyle('A2')->getFont()->setSize(9.5)->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));
        $sheet->getStyle('A2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $startRow = 4;
        $sheet->getRowDimension($startRow)->setRowHeight(28);
        $headers = [
            'A' => 'No.',
            'B' => 'Nama Produk',
            'C' => 'Kategori',
            'D' => 'Qty Terjual',
            'E' => 'Harga Jual (Rp)',
            'F' => 'HPP Satuan (Rp)',
            'G' => 'Total Omzet (Rp)',
            'H' => 'Total HPP (Rp)',
            'I' => 'Laba Kotor (Rp)',
            'J' => 'Gross Margin %',
        ];

        foreach ($headers as $col => $title) {
            $sheet->setCellValue("{$col}{$startRow}", $title);
        }

        $sheet->getStyle("A{$startRow}:J{$startRow}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle("A{$startRow}:J{$startRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_HEADER);
        $sheet->getStyle("A{$startRow}:J{$startRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$startRow}:C{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("D{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("E{$startRow}:I{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("J{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->applyRowBorder($sheet, "A{$startRow}:J{$startRow}");

        $row = $startRow + 1;
        $no = 1;

        if (empty($products)) {
            $sheet->getRowDimension($row)->setRowHeight(24);
            $sheet->mergeCells("A{$row}:J{$row}");
            $sheet->setCellValue("A{$row}", 'Tidak ada data penjualan produk pada periode ini.');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('94A3B8'));
            $this->applyRowBorder($sheet, "A{$row}:J{$row}");
            $row++;
        } else {
            foreach ($products as $p) {
                $sheet->getRowDimension($row)->setRowHeight(22);
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $p['name'] ?? '-');
                $sheet->setCellValue("C{$row}", $p['category'] ?? '-');
                $sheet->setCellValue("D{$row}", $p['quantity_sold'] ?? 0);
                $sheet->setCellValue("E{$row}", $p['unit_price'] ?? 0);
                $sheet->setCellValue("F{$row}", $p['unit_cost'] ?? 0);
                $sheet->setCellValue("G{$row}", $p['total_revenue'] ?? 0);
                $sheet->setCellValue("H{$row}", $p['total_cogs'] ?? 0);
                $sheet->setCellValue("I{$row}", $p['gross_profit'] ?? 0);
                $sheet->setCellValue("J{$row}", ($p['margin_pct'] ?? 0) / 100);

                // Alignments
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("B{$row}:C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("E{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$row}:J{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                // Formats
                $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("E{$row}:I{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('0.0%');

                // Zebra striping
                $bgColor = ($no % 2 === 0) ? self::COLOR_BG_ROW_LIGHT : self::COLOR_BG_ROW_ALT;
                $sheet->getStyle("A{$row}:J{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($bgColor);

                $this->applyRowBorder($sheet, "A{$row}:J{$row}");
                $row++;
            }

            // Total Summary Row
            $sheet->getRowDimension($row)->setRowHeight(26);
            $sheet->mergeCells("A{$row}:C{$row}");
            $sheet->setCellValue("A{$row}", 'TOTAL KESELURUHAN');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $lastDataRow = $row - 1;
            $sheet->setCellValue("D{$row}", "=SUM(D5:D{$lastDataRow})");
            $sheet->setCellValue("G{$row}", "=SUM(G5:G{$lastDataRow})");
            $sheet->setCellValue("H{$row}", "=SUM(H5:H{$lastDataRow})");
            $sheet->setCellValue("I{$row}", "=SUM(I5:I{$lastDataRow})");
            $sheet->setCellValue("J{$row}", "=IF(G{$row}>0, I{$row}/G{$row}, 0)");

            $sheet->getStyle("A{$row}:J{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:J{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
            $sheet->getStyle("A{$row}:J{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("G{$row}:I{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->getStyle("G{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('0.0%');
            $sheet->getStyle("J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $this->applyRowBorder($sheet, "A{$row}:J{$row}");
        }
    }

    private function buildExpensesSheet(Worksheet $sheet, array $data): void
    {
        $sheet->setShowGridLines(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);

        // Explicit generous widths
        $sheet->getColumnDimension('A')->setWidth(7);   // No
        $sheet->getColumnDimension('B')->setWidth(24);  // No. Pengeluaran
        $sheet->getColumnDimension('C')->setWidth(15);  // Tanggal
        $sheet->getColumnDimension('D')->setWidth(26);  // Kategori Beban
        $sheet->getColumnDimension('E')->setWidth(44);  // Judul Pengeluaran
        $sheet->getColumnDimension('F')->setWidth(22);  // Nominal (Rp)
        $sheet->getColumnDimension('G')->setWidth(38);  // Catatan / Keterangan
        $sheet->getColumnDimension('H')->setWidth(20);  // Dicatat Oleh

        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;

        $query = \App\Models\Expense::with('creator');
        if ($startDate && $endDate) {
            $query->whereBetween('expense_date', [$startDate, $endDate]);
        }
        $expenses = $query->orderByDesc('expense_date')->orderByDesc('id')->get();
        $categories = \App\Models\Expense::categories();

        // Title
        $sheet->getRowDimension(1)->setRowHeight(26);
        $sheet->mergeCells('A1:H1');
        $sheet->setCellValue('A1', 'RINCIAN BEBAN OPERASIONAL (OPERATING EXPENSES)');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getRowDimension(2)->setRowHeight(18);
        $sheet->mergeCells('A2:H2');
        $sheet->setCellValue('A2', 'Periode: ' . ($data['period_label'] ?? '-') . '   |   Total Beban Tercatat: Rp ' . number_format($expenses->sum('amount'), 0, ',', '.'));
        $sheet->getStyle('A2')->getFont()->setSize(9.5)->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));
        $sheet->getStyle('A2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $startRow = 4;
        $sheet->getRowDimension($startRow)->setRowHeight(28);
        $headers = [
            'A' => 'No.',
            'B' => 'No. Pengeluaran',
            'C' => 'Tanggal',
            'D' => 'Kategori Beban',
            'E' => 'Judul Pengeluaran',
            'F' => 'Nominal Beban (Rp)',
            'G' => 'Catatan / Keterangan',
            'H' => 'Dicatat Oleh',
        ];

        foreach ($headers as $col => $title) {
            $sheet->setCellValue("{$col}{$startRow}", $title);
        }

        $sheet->getStyle("A{$startRow}:H{$startRow}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle("A{$startRow}:H{$startRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_HEADER);
        $sheet->getStyle("A{$startRow}:H{$startRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$startRow}:C{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$startRow}:E{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("F{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("G{$startRow}:H{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $this->applyRowBorder($sheet, "A{$startRow}:H{$startRow}");

        $row = $startRow + 1;
        $no = 1;

        if ($expenses->isEmpty()) {
            $sheet->getRowDimension($row)->setRowHeight(24);
            $sheet->mergeCells("A{$row}:H{$row}");
            $sheet->setCellValue("A{$row}", 'Tidak ada beban operasional tercatat pada periode ini.');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('94A3B8'));
            $this->applyRowBorder($sheet, "A{$row}:H{$row}");
            $row++;
        } else {
            foreach ($expenses as $exp) {
                $sheet->getRowDimension($row)->setRowHeight(22);
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $exp->expense_number);
                $sheet->setCellValue("C{$row}", $exp->expense_date ? $exp->expense_date->format('d/m/Y') : '-');
                $sheet->setCellValue("D{$row}", $categories[$exp->category] ?? ucfirst($exp->category));
                $sheet->setCellValue("E{$row}", $exp->title);
                $sheet->setCellValue("F{$row}", (float) $exp->amount);
                $sheet->setCellValue("G{$row}", $exp->notes ?: '-');
                $sheet->setCellValue("H{$row}", $exp->creator ? $exp->creator->name : 'Admin');

                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("G{$row}:H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("A{$row}:H{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                $bgColor = ($no % 2 === 0) ? self::COLOR_BG_ROW_LIGHT : self::COLOR_BG_ROW_ALT;
                $sheet->getStyle("A{$row}:H{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($bgColor);

                $this->applyRowBorder($sheet, "A{$row}:H{$row}");
                $row++;
            }

            // Total Row
            $sheet->getRowDimension($row)->setRowHeight(26);
            $sheet->mergeCells("A{$row}:E{$row}");
            $sheet->setCellValue("A{$row}", 'TOTAL BEBAN OPERASIONAL');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $lastDataRow = $row - 1;
            $sheet->setCellValue("F{$row}", "=SUM(F5:F{$lastDataRow})");
            $sheet->getStyle("A{$row}:H{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:H{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
            $sheet->getStyle("A{$row}:H{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $this->applyRowBorder($sheet, "A{$row}:H{$row}");
        }
    }

    private function buildDailySalesSheet(Worksheet $sheet, array $data, ?string $exportedBy): void
    {
        $sheet->setShowGridLines(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(7);   // No
        $sheet->getColumnDimension('B')->setWidth(16);  // Tanggal
        $sheet->getColumnDimension('C')->setWidth(15);  // Hari
        $sheet->getColumnDimension('D')->setWidth(18);  // Jml Transaksi
        $sheet->getColumnDimension('E')->setWidth(18);  // Total Cup / Item
        $sheet->getColumnDimension('F')->setWidth(22);  // Omzet Kotor (Rp)
        $sheet->getColumnDimension('G')->setWidth(18);  // Diskon (Rp)
        $sheet->getColumnDimension('H')->setWidth(22);  // Omzet Bersih (Rp)
        $sheet->getColumnDimension('I')->setWidth(20);  // Tunai / Cash (Rp)
        $sheet->getColumnDimension('J')->setWidth(20);  // QRIS / Non-Tunai (Rp)
        $sheet->getColumnDimension('K')->setWidth(22);  // Metode Bayar Dominan

        $dailySales = $data['daily_sales'] ?? [];

        // Title Row 1
        $sheet->getRowDimension(1)->setRowHeight(26);
        $sheet->mergeCells('A1:K1');
        $sheet->setCellValue('A1', 'REKAPITULASI PENJUALAN HARIAN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Title Row 2
        $sheet->getRowDimension(2)->setRowHeight(18);
        $sheet->mergeCells('A2:K2');
        $sheet->setCellValue('A2', 'RAHARDJA Coffee Shop   |   Periode: ' . ($data['period_label'] ?? '-') . '   |   Dicetak: ' . date('d/m/Y H:i') . '   |   Oleh: ' . ($exportedBy ?: 'Super Admin'));
        $sheet->getStyle('A2')->getFont()->setSize(9.5)->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));
        $sheet->getStyle('A2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Headers Row 4
        $startRow = 4;
        $sheet->getRowDimension($startRow)->setRowHeight(28);
        $headers = [
            'A' => 'No.',
            'B' => 'Tanggal',
            'C' => 'Hari',
            'D' => 'Jml Transaksi',
            'E' => 'Total Cup / Item',
            'F' => 'Omzet Kotor (Rp)',
            'G' => 'Diskon (Rp)',
            'H' => 'Omzet Bersih (Rp)',
            'I' => 'Tunai / Cash (Rp)',
            'J' => 'QRIS / Non-Tunai (Rp)',
            'K' => 'Metode Bayar Dominan',
        ];

        foreach ($headers as $col => $title) {
            $sheet->setCellValue("{$col}{$startRow}", $title);
        }

        $sheet->getStyle("A{$startRow}:K{$startRow}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle("A{$startRow}:K{$startRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_HEADER);
        $sheet->getStyle("A{$startRow}:K{$startRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$startRow}:C{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$startRow}:E{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("F{$startRow}:J{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("K{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->applyRowBorder($sheet, "A{$startRow}:K{$startRow}");

        $row = $startRow + 1;
        $no = 1;

        if (empty($dailySales)) {
            $sheet->getRowDimension($row)->setRowHeight(24);
            $sheet->mergeCells("A{$row}:K{$row}");
            $sheet->setCellValue("A{$row}", 'Tidak ada data penjualan harian pada periode ini.');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('94A3B8'));
            $this->applyRowBorder($sheet, "A{$row}:K{$row}");
            $row++;
        } else {
            foreach ($dailySales as $day) {
                $sheet->getRowDimension($row)->setRowHeight(22);
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $day['formatted_date'] ?? $day['date']);
                $sheet->setCellValue("C{$row}", $day['day_name'] ?? '-');
                $sheet->setCellValue("D{$row}", $day['orders_count'] ?? 0);
                $sheet->setCellValue("E{$row}", $day['items_count'] ?? 0);
                $sheet->setCellValue("F{$row}", $day['gross_sales'] ?? 0);
                $sheet->setCellValue("G{$row}", $day['total_discounts'] ?? 0);
                $sheet->setCellValue("H{$row}", $day['net_revenue'] ?? 0);
                $sheet->setCellValue("I{$row}", $day['cash_total'] ?? 0);
                $sheet->setCellValue("J{$row}", $day['qris_total'] ?? 0);
                $sheet->setCellValue("K{$row}", $day['dominant_payment_method'] ?? 'CASH');

                $sheet->getStyle("A{$row}:C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("F{$row}:J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$row}:K{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                $sheet->getStyle("D{$row}:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("F{$row}:J{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');

                $bgColor = ($no % 2 === 0) ? self::COLOR_BG_ROW_LIGHT : self::COLOR_BG_ROW_ALT;
                $sheet->getStyle("A{$row}:K{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($bgColor);

                $this->applyRowBorder($sheet, "A{$row}:K{$row}");
                $row++;
            }

            // Total Row
            $sheet->getRowDimension($row)->setRowHeight(26);
            $sheet->mergeCells("A{$row}:C{$row}");
            $sheet->setCellValue("A{$row}", 'TOTAL REKAPITULASI');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $lastDataRow = $row - 1;
            $sheet->setCellValue("D{$row}", "=SUM(D5:D{$lastDataRow})");
            $sheet->setCellValue("E{$row}", "=SUM(E5:E{$lastDataRow})");
            $sheet->setCellValue("F{$row}", "=SUM(F5:F{$lastDataRow})");
            $sheet->setCellValue("G{$row}", "=SUM(G5:G{$lastDataRow})");
            $sheet->setCellValue("H{$row}", "=SUM(H5:H{$lastDataRow})");
            $sheet->setCellValue("I{$row}", "=SUM(I5:I{$lastDataRow})");
            $sheet->setCellValue("J{$row}", "=SUM(J5:J{$lastDataRow})");
            $sheet->setCellValue("K{$row}", '-');

            $sheet->getStyle("A{$row}:K{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:K{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
            $sheet->getStyle("A{$row}:K{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("D{$row}:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("D{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$row}:J{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->getStyle("F{$row}:J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $this->applyRowBorder($sheet, "A{$row}:K{$row}");
        }
    }

    private function buildDailyMenuSalesSheet(Worksheet $sheet, array $data, ?string $exportedBy): void
    {
        $sheet->setShowGridLines(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(7);   // No
        $sheet->getColumnDimension('B')->setWidth(14);  // Tanggal
        $sheet->getColumnDimension('C')->setWidth(10);  // Jam
        $sheet->getColumnDimension('D')->setWidth(22);  // No. Pesanan
        $sheet->getColumnDimension('E')->setWidth(24);  // Nama Pelanggan
        $sheet->getColumnDimension('F')->setWidth(34);  // Menu / Produk Terjual
        $sheet->getColumnDimension('G')->setWidth(18);  // Kategori Menu
        $sheet->getColumnDimension('H')->setWidth(8);   // Qty
        $sheet->getColumnDimension('I')->setWidth(18);  // Harga Satuan (Rp)
        $sheet->getColumnDimension('J')->setWidth(20);  // Total Harga Menu (Rp)
        $sheet->getColumnDimension('K')->setWidth(20);  // Metode Pembayaran
        $sheet->getColumnDimension('L')->setWidth(20);  // Total Transaksi (Rp)

        $items = $data['order_items_detail'] ?? [];

        // Title
        $sheet->getRowDimension(1)->setRowHeight(26);
        $sheet->mergeCells('A1:L1');
        $sheet->setCellValue('A1', 'DETAIL PENJUALAN MENU & METODE PEMBAYARAN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Subtitle
        $sheet->getRowDimension(2)->setRowHeight(18);
        $sheet->mergeCells('A2:L2');
        $sheet->setCellValue('A2', 'Daftar seluruh menu yang terjual per transaksi beserta harga satuan, total, dan metode pembayaran yang dipakai.');
        $sheet->getStyle('A2')->getFont()->setSize(9.5)->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));
        $sheet->getStyle('A2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Headers Row 4
        $startRow = 4;
        $sheet->getRowDimension($startRow)->setRowHeight(28);
        $headers = [
            'A' => 'No.',
            'B' => 'Tanggal',
            'C' => 'Jam',
            'D' => 'No. Pesanan',
            'E' => 'Nama Pelanggan',
            'F' => 'Menu / Produk Terjual',
            'G' => 'Kategori Menu',
            'H' => 'Qty',
            'I' => 'Harga Satuan (Rp)',
            'J' => 'Total Harga Menu (Rp)',
            'K' => 'Metode Pembayaran',
            'L' => 'Total Transaksi (Rp)',
        ];

        foreach ($headers as $col => $title) {
            $sheet->setCellValue("{$col}{$startRow}", $title);
        }

        $sheet->getStyle("A{$startRow}:L{$startRow}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle("A{$startRow}:L{$startRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_HEADER);
        $sheet->getStyle("A{$startRow}:L{$startRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$startRow}:D{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("E{$startRow}:F{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("G{$startRow}:H{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("I{$startRow}:J{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("K{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("L{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $this->applyRowBorder($sheet, "A{$startRow}:L{$startRow}");

        $row = $startRow + 1;
        $no = 1;

        if (empty($items)) {
            $sheet->getRowDimension($row)->setRowHeight(24);
            $sheet->mergeCells("A{$row}:L{$row}");
            $sheet->setCellValue("A{$row}", 'Tidak ada data item menu yang terjual pada periode ini.');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('94A3B8'));
            $this->applyRowBorder($sheet, "A{$row}:L{$row}");
            $row++;
        } else {
            foreach ($items as $item) {
                $sheet->getRowDimension($row)->setRowHeight(22);
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $item['formatted_date'] ?? $item['date']);
                $sheet->setCellValue("C{$row}", $item['time'] ?? '-');
                $sheet->setCellValue("D{$row}", $item['order_number'] ?? '-');
                $sheet->setCellValue("E{$row}", $item['customer_name'] ?? '-');
                $sheet->setCellValue("F{$row}", $item['product_name'] ?? '-');
                $sheet->setCellValue("G{$row}", $item['category'] ?? '-');
                $sheet->setCellValue("H{$row}", $item['quantity'] ?? 0);
                $sheet->setCellValue("I{$row}", $item['unit_price'] ?? 0);
                $sheet->setCellValue("J{$row}", $item['subtotal'] ?? 0);
                $sheet->setCellValue("K{$row}", strtoupper($item['payment_method'] ?? 'CASH'));
                $sheet->setCellValue("L{$row}", $item['order_total'] ?? 0);

                $sheet->getStyle("A{$row}:D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("E{$row}:F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("G{$row}:H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("I{$row}:J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("A{$row}:L{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("I{$row}:J{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->getStyle("L{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');

                // Colorize payment method badge text
                $methodStr = strtoupper($item['payment_method'] ?? 'CASH');
                if (str_contains($methodStr, 'QRIS')) {
                    $sheet->getStyle("K{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('0369A1')); // Cyan/Blue
                } elseif (str_contains($methodStr, 'CASH') || str_contains($methodStr, 'TUNAI')) {
                    $sheet->getStyle("K{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('15803D')); // Emerald
                } else {
                    $sheet->getStyle("K{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('B45309')); // Amber
                }

                $bgColor = ($no % 2 === 0) ? self::COLOR_BG_ROW_LIGHT : self::COLOR_BG_ROW_ALT;
                $sheet->getStyle("A{$row}:L{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($bgColor);

                $this->applyRowBorder($sheet, "A{$row}:L{$row}");
                $row++;
            }

            // Total Row
            $sheet->getRowDimension($row)->setRowHeight(26);
            $sheet->mergeCells("A{$row}:G{$row}");
            $sheet->setCellValue("A{$row}", 'TOTAL KESELURUHAN ITEM TERJUAL');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $lastDataRow = $row - 1;
            $sheet->setCellValue("H{$row}", "=SUM(H5:H{$lastDataRow})");
            $sheet->setCellValue("I{$row}", '-');
            $sheet->setCellValue("J{$row}", "=SUM(J5:J{$lastDataRow})");
            $sheet->setCellValue("K{$row}", '-');
            $sheet->setCellValue("L{$row}", '-');

            $sheet->getStyle("A{$row}:L{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:L{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
            $sheet->getStyle("A{$row}:L{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->getStyle("J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("K{$row}:L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $this->applyRowBorder($sheet, "A{$row}:L{$row}");
        }
    }

    private function buildOrdersSheet(Worksheet $sheet, array $data): void
    {
        $sheet->setShowGridLines(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);

        // Explicit generous widths
        $sheet->getColumnDimension('A')->setWidth(7);   // No
        $sheet->getColumnDimension('B')->setWidth(22);  // No. Pesanan
        $sheet->getColumnDimension('C')->setWidth(18);  // Waktu Transaksi
        $sheet->getColumnDimension('D')->setWidth(24);  // Nama Pelanggan
        $sheet->getColumnDimension('E')->setWidth(38);  // Menu yang Dibeli
        $sheet->getColumnDimension('F')->setWidth(16);  // Metode Bayar
        $sheet->getColumnDimension('G')->setWidth(20);  // Subtotal (Rp)
        $sheet->getColumnDimension('H')->setWidth(18);  // Diskon (Rp)
        $sheet->getColumnDimension('I')->setWidth(20);  // Total Bayar (Rp)
        $sheet->getColumnDimension('J')->setWidth(18);  // HPP Bahan (Rp)
        $sheet->getColumnDimension('K')->setWidth(18);  // Laba Kotor (Rp)
        $sheet->getColumnDimension('L')->setWidth(14);  // Margin %

        $orders = $data['all_orders'] ?? $data['recent_orders'] ?? [];

        // Title
        $sheet->getRowDimension(1)->setRowHeight(26);
        $sheet->mergeCells('A1:L1');
        $sheet->setCellValue('A1', 'RINCIAN TRANSAKSI PENJUALAN SELESAI');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(self::COLOR_NAVY));
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getRowDimension(2)->setRowHeight(18);
        $sheet->mergeCells('A2:L2');
        $sheet->setCellValue('A2', 'Periode: ' . ($data['period_label'] ?? '-') . '   |   Status: Lunas & Selesai');
        $sheet->getStyle('A2')->getFont()->setSize(9.5)->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));
        $sheet->getStyle('A2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $startRow = 4;
        $sheet->getRowDimension($startRow)->setRowHeight(28);
        $headers = [
            'A' => 'No.',
            'B' => 'No. Pesanan',
            'C' => 'Waktu Transaksi',
            'D' => 'Nama Pelanggan',
            'E' => 'Menu yang Dibeli (Qty)',
            'F' => 'Metode Bayar',
            'G' => 'Subtotal (Rp)',
            'H' => 'Diskon (Rp)',
            'I' => 'Total Bayar (Rp)',
            'J' => 'HPP Bahan (Rp)',
            'K' => 'Laba Kotor (Rp)',
            'L' => 'Margin %',
        ];

        foreach ($headers as $col => $title) {
            $sheet->setCellValue("{$col}{$startRow}", $title);
        }

        $sheet->getStyle("A{$startRow}:L{$startRow}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle("A{$startRow}:L{$startRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_HEADER);
        $sheet->getStyle("A{$startRow}:L{$startRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$startRow}:C{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$startRow}:E{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("F{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("G{$startRow}:K{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("L{$startRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->applyRowBorder($sheet, "A{$startRow}:L{$startRow}");

        $row = $startRow + 1;
        $no = 1;

        if (empty($orders)) {
            $sheet->getRowDimension($row)->setRowHeight(24);
            $sheet->mergeCells("A{$row}:L{$row}");
            $sheet->setCellValue("A{$row}", 'Tidak ada transaksi penjualan selesai pada periode ini.');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('94A3B8'));
            $this->applyRowBorder($sheet, "A{$row}:L{$row}");
            $row++;
        } else {
            foreach ($orders as $o) {
                $sheet->getRowDimension($row)->setRowHeight(22);
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $o['order_number'] ?? '-');
                $sheet->setCellValue("C{$row}", $o['date'] ?? '-');
                $sheet->setCellValue("D{$row}", $o['customer_name'] ?? '-');
                $sheet->setCellValue("E{$row}", $o['items_summary'] ?? '-');
                $sheet->setCellValue("F{$row}", strtoupper($o['payment_method'] ?? 'CASH'));
                $sheet->setCellValue("G{$row}", $o['subtotal'] ?? 0);
                $sheet->setCellValue("H{$row}", $o['discount'] ?? 0);
                $sheet->setCellValue("I{$row}", $o['total'] ?? 0);
                $sheet->setCellValue("J{$row}", $o['cogs'] ?? 0);
                $sheet->setCellValue("K{$row}", $o['gross_profit'] ?? 0);
                $sheet->setCellValue("L{$row}", ($o['margin_pct'] ?? 0) / 100);

                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("B{$row}:C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("G{$row}:K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$row}:L{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                $sheet->getStyle("G{$row}:K{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->getStyle("L{$row}")->getNumberFormat()->setFormatCode('0.0%');

                $bgColor = ($no % 2 === 0) ? self::COLOR_BG_ROW_LIGHT : self::COLOR_BG_ROW_ALT;
                $sheet->getStyle("A{$row}:L{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($bgColor);

                $this->applyRowBorder($sheet, "A{$row}:L{$row}");
                $row++;
            }

            // Total Row
            $sheet->getRowDimension($row)->setRowHeight(26);
            $sheet->mergeCells("A{$row}:F{$row}");
            $sheet->setCellValue("A{$row}", 'TOTAL KESELURUHAN');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $lastDataRow = $row - 1;
            $sheet->setCellValue("G{$row}", "=SUM(G5:G{$lastDataRow})");
            $sheet->setCellValue("H{$row}", "=SUM(H5:H{$lastDataRow})");
            $sheet->setCellValue("I{$row}", "=SUM(I5:I{$lastDataRow})");
            $sheet->setCellValue("J{$row}", "=SUM(J5:J{$lastDataRow})");
            $sheet->setCellValue("K{$row}", "=SUM(K5:K{$lastDataRow})");
            $sheet->setCellValue("L{$row}", "=IF(I{$row}>0, K{$row}/I{$row}, 0)");

            $sheet->getStyle("A{$row}:L{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:L{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::COLOR_BG_TOTAL);
            $sheet->getStyle("A{$row}:L{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("G{$row}:K{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->getStyle("G{$row}:K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("L{$row}")->getNumberFormat()->setFormatCode('0.0%');
            $sheet->getStyle("L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $this->applyRowBorder($sheet, "A{$row}:L{$row}");
        }
    }

    private function formatAccountingDataRow(Worksheet $sheet, int $row): void
    {
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(2);
        $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0;[Red]-"Rp "#,##0;"Rp "0');
        $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0;[Red]-"Rp "#,##0;"Rp "0');
        $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $this->applyRowBorder($sheet, "A{$row}:E{$row}");
    }

    private function formatAccountingTotalRow(Worksheet $sheet, int $row): void
    {
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
        $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
        $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0;[Red]-"Rp "#,##0;"Rp "0');
        $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // Border top & bottom
        $sheet->getStyle("A{$row}:E{$row}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle("A{$row}:E{$row}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle("A{$row}")->getBorders()->getLeft()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle("E{$row}")->getBorders()->getRight()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
    }

    private function applyRowBorder(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
    }

    private function applyBoxBorder(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle($range)->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle($range)->getBorders()->getLeft()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
        $sheet->getStyle($range)->getBorders()->getRight()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::COLOR_BORDER_GRAY);
    }
}
