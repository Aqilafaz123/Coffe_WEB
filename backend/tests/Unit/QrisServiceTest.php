<?php

namespace Tests\Unit;

use App\Services\QrisService;
use PHPUnit\Framework\TestCase;

class QrisServiceTest extends TestCase
{
    public function test_crc_matches_standard_vector_and_merchant_payload(): void
    {
        $service = new QrisService;
        $this->assertSame('29B1', $service->crc('123456789'));
        $this->assertStringEndsWith('6304F941', $service->payload('10000.00'));
        $this->assertStringEndsWith('63049E69', $service->payload('10.00'));
    }

    public function test_amount_length_changes_without_modifying_merchant_data(): void
    {
        $service = new QrisService;
        $this->assertSame(str_replace('540510000', '5406125000', substr($service->payload('10000'), 0, -4)), substr($service->payload('125000'), 0, -4));
        $this->assertStringContainsString('540412.55802ID', $service->payload('12.50'));
    }

    public function test_zero_amount_is_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QrisService)->payload('0.00');
    }
}
