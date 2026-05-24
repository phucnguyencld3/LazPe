using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using PolyBabyAPI.Services;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AddressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AddressApiService _addressApiService;
        private readonly ILogger<AddressController> _logger;

        public AddressController(
            ApplicationDbContext context,
            AddressApiService addressApiService,
            ILogger<AddressController> logger)
        {
            _context = context;
            _addressApiService = addressApiService;
            _logger = logger;
        }

        #region Vietnam Address API (External)

        /// <summary>
        /// Lấy danh sách tỉnh/thành phố từ API Vietnam
        /// </summary>
        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            try
            {
                var provinces = await _addressApiService.GetProvincesAsync();
                return Ok(new { success = true, data = provinces });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provinces");
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách tỉnh/thành phố" });
            }
        }

        /// <summary>
        /// Lấy danh sách quận/huyện theo tỉnh từ API Vietnam
        /// </summary>
        [HttpGet("districts/{provinceCode}")]
        public async Task<IActionResult> GetDistricts(int provinceCode)
        {
            try
            {
                var districts = await _addressApiService.GetDistrictByProvinceAsync(provinceCode);
                return Ok(new { success = true, data = districts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting districts for province {ProvinceCode}", provinceCode);
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách quận/huyện" });
            }
        }

        /// <summary>
        /// Lấy danh sách phường/xã theo quận/huyện từ API Vietnam
        /// </summary>
        [HttpGet("wards/{districtCode}")]
        public async Task<IActionResult> GetWards(int districtCode)
        {
            try
            {
                var wards = await _addressApiService.GetWardByDistrictAsync(districtCode);
                return Ok(new { success = true, data = wards });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting wards for district {DistrictCode}", districtCode);
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách phường/xã" });
            }
        }

        #endregion

        #region User Address Management

        /// <summary>
        /// Lấy danh sách địa chỉ của user
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserAddresses(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { success = false, message = "UserId không được để trống" });
            }

            try
            {
                var addresses = await _context.UserAddresses
                    .Where(a => a.UserID == userId)
                    .Include(a => a.Province)
                    .Include(a => a.District)
                    .Include(a => a.Ward)
                    .OrderByDescending(a => a.IsDefault)
                    .ThenByDescending(a => a.CreatedAt)
                    .Select(a => new
                    {
                        a.AddressID,
                        a.RecipientName,
                        a.PhoneNumber,
                        Province = a.Province != null ? a.Province.Name : "",
                        ProvinceCode = a.Province != null ? a.Province.Code : "",
                        District = a.District != null ? a.District.Name : "",
                        DistrictCode = a.District != null ? a.District.Code : "",
                        Ward = a.Ward != null ? a.Ward.Name : "",
                        WardCode = a.Ward != null ? a.Ward.Code : "",
                        DetailAddress = a.StreetAddress,
                        a.IsDefault,
                        a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = addresses });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting addresses for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy danh sách địa chỉ" });
            }
        }

        /// <summary>
        /// Tạo địa chỉ mới với Vietnam Address API
        /// </summary>
        [HttpPost("create-vietnam")]
        public async Task<IActionResult> CreateVietnamAddress([FromBody] CreateVietnamAddressDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
                if (dto.IsDefault)
                {
                    var existingAddresses = await _context.UserAddresses
                        .Where(a => a.UserID == dto.UserId && a.IsDefault)
                        .ToListAsync();

                    foreach (var addr in existingAddresses)
                    {
                        addr.IsDefault = false;
                    }
                }

                // Tìm hoặc tự động tạo mới bản ghi Province
                var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Code == dto.ProvinceCode);
                if (province == null)
                {
                    province = new Province
                    {
                        Code = dto.ProvinceCode,
                        Name = dto.ProvinceName,
                        IsActive = true
                    };
                    _context.Provinces.Add(province);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tự động tạo mới bản ghi District
                var district = await _context.Districts.FirstOrDefaultAsync(d => d.Code == dto.DistrictCode);
                if (district == null)
                {
                    district = new District
                    {
                        Code = dto.DistrictCode,
                        Name = dto.DistrictName,
                        ProvinceID = province.ProvinceID,
                        IsActive = true
                    };
                    _context.Districts.Add(district);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tự động tạo mới bản ghi Ward
                var ward = await _context.Wards.FirstOrDefaultAsync(w => w.Code == dto.WardCode);
                if (ward == null)
                {
                    ward = new Ward
                    {
                        Code = dto.WardCode,
                        Name = dto.WardName,
                        DistrictID = district.DistrictID,
                        IsActive = true
                    };
                    _context.Wards.Add(ward);
                    await _context.SaveChangesAsync();
                }

                // Tạo địa chỉ mới
                var newAddress = new UserAddress
                {
                    UserID = dto.UserId,
                    RecipientName = dto.RecipientName,
                    PhoneNumber = dto.PhoneNumber,
                    ProvinceID = province.ProvinceID,
                    DistrictID = district.DistrictID,
                    WardID = ward.WardID,
                    StreetAddress = dto.DetailAddress,
                    IsDefault = dto.IsDefault,
                    CreatedAt = DateTime.Now
                };

                _context.UserAddresses.Add(newAddress);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Address created successfully for user {UserId}", dto.UserId);

                return Ok(new
                {
                    success = true,
                    message = "Thêm địa chỉ thành công!",
                    data = new
                    {
                        AddressId = newAddress.AddressID
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Vietnam address for user {UserId}", dto.UserId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi tạo địa chỉ" });
            }
        }

        /// <summary>
        /// Cập nhật địa chỉ
        /// </summary>
        [HttpPut("update/{addressId}")]
        public async Task<IActionResult> UpdateAddress(int addressId, [FromBody] UpdateVietnamAddressDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var address = await _context.UserAddresses.FindAsync(addressId);
                if (address == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
                }

                // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
                if (dto.IsDefault && !address.IsDefault)
                {
                    var otherAddresses = await _context.UserAddresses
                        .Where(a => a.UserID == address.UserID && a.AddressID != addressId && a.IsDefault)
                        .ToListAsync();

                    foreach (var addr in otherAddresses)
                    {
                        addr.IsDefault = false;
                    }
                }

                // Tìm hoặc tự động tạo mới bản ghi Province
                var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Code == dto.ProvinceCode);
                if (province == null)
                {
                    province = new Province
                    {
                        Code = dto.ProvinceCode,
                        Name = dto.ProvinceName,
                        IsActive = true
                    };
                    _context.Provinces.Add(province);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tự động tạo mới bản ghi District
                var district = await _context.Districts.FirstOrDefaultAsync(d => d.Code == dto.DistrictCode);
                if (district == null)
                {
                    district = new District
                    {
                        Code = dto.DistrictCode,
                        Name = dto.DistrictName,
                        ProvinceID = province.ProvinceID,
                        IsActive = true
                    };
                    _context.Districts.Add(district);
                    await _context.SaveChangesAsync();
                }

                // Tìm hoặc tự động tạo mới bản ghi Ward
                var ward = await _context.Wards.FirstOrDefaultAsync(w => w.Code == dto.WardCode);
                if (ward == null)
                {
                    ward = new Ward
                    {
                        Code = dto.WardCode,
                        Name = dto.WardName,
                        DistrictID = district.DistrictID,
                        IsActive = true
                    };
                    _context.Wards.Add(ward);
                    await _context.SaveChangesAsync();
                }

                // Cập nhật thông tin
                address.RecipientName = dto.RecipientName;
                address.PhoneNumber = dto.PhoneNumber;
                address.ProvinceID = province.ProvinceID;
                address.DistrictID = district.DistrictID;
                address.WardID = ward.WardID;
                address.StreetAddress = dto.DetailAddress;
                address.IsDefault = dto.IsDefault;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật địa chỉ thành công!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating address {AddressId}", addressId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi cập nhật địa chỉ" });
            }
        }

        /// <summary>
        /// Xóa địa chỉ
        /// </summary>
        [HttpDelete("delete/{addressId}")]
        public async Task<IActionResult> DeleteAddress(int addressId)
        {
            try
            {
                var address = await _context.UserAddresses.FindAsync(addressId);
                if (address == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
                }

                // Không cho xóa địa chỉ mặc định cuối cùng
                if (address.IsDefault)
                {
                    var otherAddressCount = await _context.UserAddresses
                        .CountAsync(a => a.UserID == address.UserID && a.AddressID != addressId);

                    if (otherAddressCount > 0)
                    {
                        // Đặt một địa chỉ khác làm mặc định
                        var nextAddress = await _context.UserAddresses
                            .Where(a => a.UserID == address.UserID && a.AddressID != addressId)
                            .OrderByDescending(a => a.CreatedAt)
                            .FirstAsync();

                        nextAddress.IsDefault = true;
                    }
                }

                _context.UserAddresses.Remove(address);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa địa chỉ thành công!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting address {AddressId}", addressId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi xóa địa chỉ" });
            }
        }

        /// <summary>
        /// Đặt địa chỉ mặc định
        /// </summary>
        [HttpPost("set-default/{addressId}")]
        public async Task<IActionResult> SetDefaultAddress(int addressId)
        {
            try
            {
                var address = await _context.UserAddresses.FindAsync(addressId);
                if (address == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
                }

                // Bỏ mặc định tất cả địa chỉ khác của user
                var otherAddresses = await _context.UserAddresses
                    .Where(a => a.UserID == address.UserID && a.AddressID != addressId)
                    .ToListAsync();

                foreach (var addr in otherAddresses)
                {
                    addr.IsDefault = false;
                }

                // Đặt địa chỉ này làm mặc định
                address.IsDefault = true;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đặt địa chỉ mặc định thành công!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting default address {AddressId}", addressId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi đặt địa chỉ mặc định" });
            }
        }

        /// <summary>
        /// Lấy địa chỉ mặc định của user
        /// </summary>
        [HttpGet("default/{userId}")]
        public async Task<IActionResult> GetDefaultAddress(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { success = false, message = "UserId không được để trống" });
            }

            try
            {
                var defaultAddress = await _context.UserAddresses
                    .Where(a => a.UserID == userId && a.IsDefault)
                    .Include(a => a.Province)
                    .Include(a => a.District)
                    .Include(a => a.Ward)
                    .Select(a => new
                    {
                        a.AddressID,
                        a.RecipientName,
                        a.PhoneNumber,
                        Province = a.Province != null ? a.Province.Name : "",
                        ProvinceCode = a.Province != null ? a.Province.Code : "",
                        District = a.District != null ? a.District.Name : "",
                        DistrictCode = a.District != null ? a.District.Code : "",
                        Ward = a.Ward != null ? a.Ward.Name : "",
                        WardCode = a.Ward != null ? a.Ward.Code : "",
                        DetailAddress = a.StreetAddress,
                        FullAddress = $"{a.StreetAddress}, {(a.Ward != null ? a.Ward.Name : "")}, {(a.District != null ? a.District.Name : "")}, {(a.Province != null ? a.Province.Name : "")}"
                    })
                    .FirstOrDefaultAsync();

                if (defaultAddress == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy địa chỉ mặc định" });
                }

                return Ok(new { success = true, data = defaultAddress });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting default address for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy địa chỉ mặc định" });
            }
        }

        // ======================== ACTIVE INTERNAL BOUNDARIES ============================

        /// <summary>
        /// Lấy danh sách tỉnh/thành phố đang hoạt động (IsActive = true) từ DB nội bộ
        /// </summary>
        [HttpGet("active-provinces")]
        public async Task<IActionResult> GetActiveProvinces()
        {
            try
            {
                var provinces = await _context.Provinces
                    .Where(p => p.IsActive)
                    .Select(p => new { p.ProvinceID, p.Code, p.Name })
                    .ToListAsync();
                return Ok(new { success = true, data = provinces });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active provinces");
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách tỉnh/thành phố" });
            }
        }

        /// <summary>
        /// Lấy danh sách quận/huyện đang hoạt động (IsActive = true) từ DB nội bộ
        /// </summary>
        [HttpGet("active-districts/{provinceId}")]
        public async Task<IActionResult> GetActiveDistricts(int provinceId)
        {
            try
            {
                var districts = await _context.Districts
                    .Where(d => d.ProvinceID == provinceId && d.IsActive)
                    .Select(d => new { d.DistrictID, d.Code, d.Name, d.ProvinceID })
                    .ToListAsync();
                return Ok(new { success = true, data = districts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active districts");
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách quận/huyện" });
            }
        }

        /// <summary>
        /// Lấy danh sách phường/xã đang hoạt động (IsActive = true) từ DB nội bộ
        /// </summary>
        [HttpGet("active-wards/{districtId}")]
        public async Task<IActionResult> GetActiveWards(int districtId)
        {
            try
            {
                var wards = await _context.Wards
                    .Where(w => w.DistrictID == districtId && w.IsActive)
                    .Select(w => new { w.WardID, w.Code, w.Name, w.DistrictID })
                    .ToListAsync();
                return Ok(new { success = true, data = wards });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active wards");
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách phường/xã" });
            }
        }

        #endregion
    }

    #region DTOs

    public class CreateVietnamAddressDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = "";

        [Required(ErrorMessage = "Tên người nhận là bắt buộc")]
        [MaxLength(100, ErrorMessage = "Tên người nhận không được quá 100 ký tự")]
        public string RecipientName { get; set; } = "";

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; } = "";

        [Required(ErrorMessage = "Mã tỉnh/thành phố là bắt buộc")]
        public string ProvinceCode { get; set; } = "";

        [Required(ErrorMessage = "Tên tỉnh/thành phố là bắt buộc")]
        public string ProvinceName { get; set; } = "";

        [Required(ErrorMessage = "Mã quận/huyện là bắt buộc")]
        public string DistrictCode { get; set; } = "";

        [Required(ErrorMessage = "Tên quận/huyện là bắt buộc")]
        public string DistrictName { get; set; } = "";

        [Required(ErrorMessage = "Mã phường/xã là bắt buộc")]
        public string WardCode { get; set; } = "";

        [Required(ErrorMessage = "Tên phường/xã là bắt buộc")]
        public string WardName { get; set; } = "";

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [MaxLength(500, ErrorMessage = "Địa chỉ chi tiết không được quá 500 ký tự")]
        public string DetailAddress { get; set; } = "";

        public bool IsDefault { get; set; } = false;
    }

    public class UpdateVietnamAddressDto : CreateVietnamAddressDto
    {
        // Inherit from Create DTO, UserId sẽ được lấy từ existing record
    }

    #endregion
}
